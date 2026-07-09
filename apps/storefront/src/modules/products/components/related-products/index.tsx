import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

async function fetchRelatedProducts(
  product: HttpTypes.StoreProduct,
  countryCode: string
) {
  const tagIds =
    product.tags?.map((tag) => tag.id).filter(Boolean) as string[] | undefined

  if (tagIds?.length) {
    const byTags = await listProducts({
      countryCode,
      route: `/${countryCode}/products/${product.handle}/related`,
      queryParams: {
        tag_id: tagIds,
        is_giftcard: false,
        limit: 12,
      },
    })

    const tagMatches = byTags.response.products.filter(
      (candidate) => candidate.id !== product.id
    )

    if (tagMatches.length) {
      return tagMatches
    }
  }

  if (product.collection_id) {
    const byCollection = await listProducts({
      countryCode,
      route: `/${countryCode}/products/${product.handle}/related`,
      collectionHandle: product.collection?.handle ?? null,
      queryParams: {
        collection_id: [product.collection_id],
        is_giftcard: false,
        limit: 12,
      },
    })

    return byCollection.response.products.filter(
      (candidate) => candidate.id !== product.id
    )
  }

  return []
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const products = await fetchRelatedProducts(product, countryCode)

  if (!products.length) {
    return null
  }

  return (
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="text-base-regular text-gray-600 mb-6">
          Related products
        </span>
        <p className="text-2xl-regular text-ui-fg-base max-w-lg">
          You might also want to check out these products.
        </p>
      </div>

      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {products.map((product) => (
          <li key={product.id}>
            <Product region={region} product={product} />
          </li>
        ))}
      </ul>
    </div>
  )
}
