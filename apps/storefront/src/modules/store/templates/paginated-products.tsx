import { listProductsWithSort } from "@lib/data/products"
import { getDefaultCountryCode } from "@lib/constants/region"
import { getRegion } from "@lib/data/regions"
import { logPageRender } from "@lib/util/storefront-fetch-log"
import ProductPreview from "@modules/products/components/product-preview"
import EmptyProducts from "@modules/store/components/empty-products"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const GRID_PRODUCTS_PAGE_SIZE = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  categoryIds,
  productsIds,
  countryCode,
  route,
  collectionHandle,
  categoryHandle,
  pageSize = GRID_PRODUCTS_PAGE_SIZE,
  emptyTitle,
  emptyDescription,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  categoryIds?: string[]
  productsIds?: string[]
  countryCode: string
  route: string
  collectionHandle?: string
  categoryHandle?: string
  pageSize?: number
  emptyTitle?: string
  emptyDescription?: string
}) {
  const queryParams: PaginatedProductsParams = {
    limit: pageSize,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryIds?.length) {
    queryParams["category_id"] = categoryIds
  } else if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  const region = await getRegion(countryCode)

  logPageRender(route, {
    step: "paginated_products",
    hasRegion: Boolean(region),
    regionId: region?.id,
    collectionId: collectionId ?? null,
    categoryId: categoryId ?? null,
    categoryIds: categoryIds ?? null,
    page,
    pageSize,
  })

  if (!region) {
    return (
      <EmptyProducts
        title="Store unavailable in this region"
        description={`Showing the ${getDefaultCountryCode().toUpperCase()} store is not available from this link. Use the menu to continue shopping.`}
      />
    )
  }

  const {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
    route,
    collectionHandle,
    categoryHandle,
    pageSize,
  })

  const totalPages = Math.ceil(count / pageSize)

  if (!products.length) {
    return (
      <EmptyProducts
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {products.map((p) => {
          return (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
