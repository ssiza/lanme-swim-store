import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

/**
 * Return collections that have at least one product visible in the storefront region.
 */
export async function filterCollectionsWithProducts(
  collections: HttpTypes.StoreCollection[],
  countryCode: string
): Promise<HttpTypes.StoreCollection[]> {
  if (!collections.length) {
    return []
  }

  const results = await Promise.all(
    collections.map(async (collection) => {
      const { response } = await listProducts({
        countryCode,
        route: "filterCollectionsWithProducts",
        queryParams: {
          collection_id: [collection.id],
          limit: 1,
          fields: "id",
        },
      })

      return response.count > 0 ? collection : null
    })
  )

  return results.filter(
    (collection): collection is HttpTypes.StoreCollection => collection !== null
  )
}
