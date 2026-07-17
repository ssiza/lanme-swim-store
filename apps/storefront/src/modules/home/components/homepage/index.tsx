import type {
  HomepageCategoryBanner,
  HomepageCollectionBlock,
  HomepageHeroSlide,
  HomepageSettings,
} from "@lib/data/homepage"
import { HttpTypes } from "@medusajs/types"
import ProductRail from "@modules/home/components/featured-products/product-rail"
import Hero from "@modules/home/components/hero"
import ImageBanner from "@modules/home/components/image-banner"

type HomepageProps = {
  settings: HomepageSettings
  collections: HttpTypes.StoreCollection[]
  region: HttpTypes.StoreRegion | null
  countryCode: string
}

const Homepage = ({
  settings,
  collections,
  region,
  countryCode,
}: HomepageProps) => {
  const slides: HomepageHeroSlide[] = settings.hero_slides
  const categoryBanners: HomepageCategoryBanner[] =
    settings.featured_categories
  const collectionBlocks: HomepageCollectionBlock[] =
    settings.featured_collections

  const byId = new Map(collections.map((c) => [c.id, c] as const))

  const orderedBlocks =
    collectionBlocks.length > 0
      ? collectionBlocks
      : collections.map(
          (collection, index): HomepageCollectionBlock => ({
            id: collection.id,
            handle: collection.handle,
            title: collection.title,
            promo_headline: null,
            description: null,
            cover_image_url: null,
            mobile_image_url: null,
            cta_label: null,
            cta_href: `/collections/${collection.handle}`,
            display_order: index,
            featured_on_homepage: false,
            show_products_on_homepage: true,
          })
        )

  return (
    <div className="flex flex-col bg-[#F7F4EF]">
      <Hero
        slides={slides}
        backgroundImageUrl={settings.hero_background_image_url}
        collectionsHref="/store"
      />

      {categoryBanners.map((category, index) => (
        <ImageBanner
          key={category.id}
          title={category.title}
          subtitle={category.subtitle}
          desktopImage={category.cover_image_url}
          mobileImage={category.mobile_cover_image_url}
          href={category.href}
          ctaLabel="Explore"
          size={index === 0 ? "tall" : "medium"}
          align={index % 2 === 0 ? "left" : "right"}
          priority={index === 0}
        />
      ))}

      {orderedBlocks.map((block, index) => {
        const collection = byId.get(block.id)
        const showBanner = Boolean(
          block.cover_image_url || block.mobile_image_url
        )

        return (
          <div key={block.id} className="flex flex-col">
            {showBanner ? (
              <ImageBanner
                title={block.promo_headline || block.title}
                description={block.description}
                desktopImage={block.cover_image_url}
                mobileImage={block.mobile_image_url}
                href={block.cta_href || `/collections/${block.handle}`}
                ctaLabel={block.cta_label || "Shop the edit"}
                size="tall"
                align={index % 2 === 0 ? "left" : "center"}
              />
            ) : null}

            {region && block.show_products_on_homepage && collection ? (
              <ProductRail
                collection={collection}
                region={region}
                countryCode={countryCode}
                headline={block.promo_headline}
                ctaLabel={block.cta_label}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export default Homepage
