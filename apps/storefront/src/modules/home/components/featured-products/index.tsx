import type { HomepageCollectionBlock } from "@lib/data/homepage"
import { HttpTypes } from "@medusajs/types"
import ProductRail from "@modules/home/components/featured-products/product-rail"

export default async function FeaturedProducts({
  collections,
  region,
  countryCode,
  collectionBlocks = [],
}: {
  collections: HttpTypes.StoreCollection[]
  region: HttpTypes.StoreRegion
  countryCode: string
  collectionBlocks?: HomepageCollectionBlock[]
}) {
  const blockById = new Map(
    collectionBlocks.map((block) => [block.id, block] as const)
  )

  return collections.map((collection) => {
    const block = blockById.get(collection.id)

    return (
      <li key={collection.id}>
        <ProductRail
          collection={collection}
          region={region}
          countryCode={countryCode}
          headline={block?.promo_headline}
          ctaLabel={block?.cta_label}
        />
      </li>
    )
  })
}
