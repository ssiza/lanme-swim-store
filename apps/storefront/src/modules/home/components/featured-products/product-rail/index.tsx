import { listProducts } from "@lib/data/products"
import { SITE_COPY } from "@lib/constants/site"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"
import Reveal from "@modules/common/components/reveal"

export default async function ProductRail({
  collection,
  region,
  countryCode,
  headline,
  ctaLabel,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
  countryCode: string
  headline?: string | null
  ctaLabel?: string | null
}) {
  const { response } = await listProducts({
    countryCode,
    route: `/${countryCode}/`,
    collectionHandle: collection.handle,
    queryParams: {
      collection_id: [collection.id],
      limit: 8,
      fields: "*variants.calculated_price",
    },
  })

  const pricedProducts = response?.products ?? []

  if (!pricedProducts.length) {
    return null
  }

  return (
    <Reveal>
      <div className="content-container py-14 small:py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <Text className="font-display text-2xl font-normal tracking-tight text-brand-ink small:text-4xl">
            {headline || collection.title}
          </Text>
          <InteractiveLink href={`/collections/${collection.handle}`}>
            {ctaLabel || SITE_COPY.shopSwim}
          </InteractiveLink>
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-12 small:grid-cols-4 small:gap-x-6 small:gap-y-16">
          {pricedProducts.map((product, index) => (
            <li
              key={product.id}
              className="transition-transform duration-500 ease-out hover:-translate-y-1"
              style={{ transitionDelay: `${Math.min(index, 3) * 40}ms` }}
            >
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  )
}
