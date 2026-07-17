import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework"
import { getCategoryHomepageSettings } from "./category-homepage-settings"
import { getCollectionHomepageSettings } from "./collection-homepage-settings"
import { getFooterSettings } from "./footer-settings"
import { getHomepageHeroSettings, type HeroSlide } from "./homepage-settings"

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

/**
 * Turn relative Medusa/local upload paths into absolute URLs the storefront
 * can load. Absolute http(s) URLs (S3) are left unchanged.
 */
export const resolvePublicMediaUrl = (
  url: string | null | undefined,
  backendUrl?: string | null
): string | null => {
  if (!url || typeof url !== "string") {
    return null
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return null
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("//")) {
    return trimmed.startsWith("//") ? `https:${trimmed}` : trimmed
  }

  const base = (backendUrl || process.env.MEDUSA_BACKEND_URL || "")
    .trim()
    .replace(/\/$/, "")

  if (!base) {
    return trimmed
  }

  return `${base}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`
}

const resolveSlide = (slide: HeroSlide, backendUrl: string | null): HeroSlide => ({
  ...slide,
  desktop_image_url: resolvePublicMediaUrl(slide.desktop_image_url, backendUrl),
  mobile_image_url: resolvePublicMediaUrl(slide.mobile_image_url, backendUrl),
})

export async function buildHomepagePayload(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const backendUrl =
    process.env.MEDUSA_BACKEND_URL?.replace(/\/$/, "") ||
    process.env.BACKEND_URL?.replace(/\/$/, "") ||
    null

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
  const hero_slides = hero.hero_slides.map((slide) =>
    resolveSlide(slide, backendUrl)
  )

  const featured_categories = (categories ?? [])
    .map((category) => {
      const settings = getCategoryHomepageSettings(
        category.metadata as Record<string, unknown> | null | undefined,
        category.name
      )

      // A cover image means show this category as a homepage banner.
      if (!settings.cover_image_url) {
        return null
      }

      return {
        id: category.id,
        handle: category.handle,
        name: category.name,
        title: settings.title ?? category.name,
        subtitle: settings.subtitle,
        cover_image_url: resolvePublicMediaUrl(
          settings.cover_image_url,
          backendUrl
        ),
        mobile_cover_image_url: resolvePublicMediaUrl(
          settings.mobile_cover_image_url,
          backendUrl
        ),
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

      const hasCover = Boolean(settings.cover_image_url)
      // A cover image means "show this as a homepage banner".
      const hasBanner = hasCover

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
        cover_image_url: resolvePublicMediaUrl(
          settings.cover_image_url,
          backendUrl
        ),
        mobile_image_url: resolvePublicMediaUrl(
          settings.mobile_image_url,
          backendUrl
        ),
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

  return {
    hero_background_image_url: resolvePublicMediaUrl(
      hero.hero_background_image_url,
      backendUrl
    ),
    hero_slides,
    featured_categories,
    featured_collections,
    footer_about: footer.about,
    footer_address: footer.address,
    footer_links: footer.links,
    footer_support_links: footer.support_links,
    footer_about_links: footer.about_links,
    footer_configured: footer.configured,
  }
}
