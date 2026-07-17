import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getCategoryHomepageSettings } from "../../../lib/category-homepage-settings"
import { getCollectionHomepageSettings } from "../../../lib/collection-homepage-settings"
import { getFooterSettings } from "../../../lib/footer-settings"
import { getHomepageHeroSettings } from "../../../lib/homepage-settings"

async function safeGraphQuery<T>(
  query: {
    graph: (args: Record<string, unknown>) => Promise<{ data: T[] }>
  },
  args: Record<string, unknown>
): Promise<T[]> {
  try {
    const { data } = await query.graph(args)
    return data ?? []
  } catch {
    return []
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Store metadata is required for footer/hero — query it alone first so a
  // category/collection graph failure cannot blank the entire homepage CMS.
  const stores = await safeGraphQuery<{
    metadata?: Record<string, unknown> | null
  }>(query, {
    entity: "store",
    fields: ["metadata"],
  })

  const [categories, collections] = await Promise.all([
    safeGraphQuery<{
      id: string
      name: string
      handle: string
      metadata?: Record<string, unknown> | null
    }>(query, {
      entity: "product_category",
      fields: ["id", "name", "handle", "metadata", "rank"],
    }),
    safeGraphQuery<{
      id: string
      title: string
      handle: string
      metadata?: Record<string, unknown> | null
    }>(query, {
      entity: "product_collection",
      fields: ["id", "title", "handle", "metadata"],
    }),
  ])

  const store = stores?.[0]
  const metadata = store?.metadata as Record<string, unknown> | null | undefined
  const footer = getFooterSettings(metadata)
  const hero = getHomepageHeroSettings(metadata)

  const featured_categories = (categories ?? [])
    .map((category) => {
      const settings = getCategoryHomepageSettings(
        category.metadata as Record<string, unknown> | null | undefined,
        category.name
      )

      if (!settings.featured_on_homepage || !settings.cover_image_url) {
        return null
      }

      return {
        id: category.id,
        handle: category.handle,
        name: category.name,
        title: settings.title ?? category.name,
        subtitle: settings.subtitle,
        cover_image_url: settings.cover_image_url,
        mobile_cover_image_url: settings.mobile_cover_image_url,
        display_order: settings.display_order,
        href: `/categories/${category.handle}`,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => a.display_order - b.display_order)

  const featured_collections = (collections ?? [])
    .map((collection) => {
      const settings = getCollectionHomepageSettings(
        collection.metadata as Record<string, unknown> | null | undefined
      )

      const hasBanner =
        settings.featured_on_homepage && Boolean(settings.cover_image_url)

      if (!hasBanner && !settings.show_products_on_homepage) {
        return null
      }

      const explicitlyConfigured =
        settings.featured_on_homepage ||
        Boolean(settings.cover_image_url) ||
        Boolean(settings.promo_headline) ||
        settings.display_order !== 0

      return {
        id: collection.id,
        handle: collection.handle,
        title: collection.title,
        promo_headline: settings.promo_headline,
        description: settings.description,
        cover_image_url: settings.cover_image_url,
        mobile_image_url: settings.mobile_image_url,
        cta_label: settings.cta_label,
        cta_href: settings.cta_href ?? `/collections/${collection.handle}`,
        display_order: settings.display_order,
        featured_on_homepage: hasBanner,
        show_products_on_homepage: settings.show_products_on_homepage,
        explicitly_configured: explicitlyConfigured,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => a.display_order - b.display_order)

  res.json({
    hero_background_image_url: hero.hero_background_image_url,
    hero_slides: hero.hero_slides,
    featured_categories,
    featured_collections,
    footer_about: footer.about,
    footer_address: footer.address,
    footer_links: footer.links,
    footer_support_links: footer.support_links,
    footer_about_links: footer.about_links,
    footer_configured: footer.configured,
  })
}
