import { Suspense } from "react"

import { SITE_COPY } from "@lib/constants/site"
import { STORE_PRODUCTS_PAGE_SIZE } from "@lib/constants/products"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} />
      <div className="w-full">
        <div className="mb-8">
          <h1
            data-testid="store-page-title"
            className="font-display text-3xl font-normal tracking-tight text-brand-ink"
          >
            {SITE_COPY.shopAll}
          </h1>
          <p className="mt-2 text-ui-fg-subtle text-base-regular">
            {SITE_COPY.collectionsIntro}
          </p>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
            route={`/${countryCode}/store`}
            pageSize={STORE_PRODUCTS_PAGE_SIZE}
            emptyTitle={SITE_COPY.emptyCatalogTitle}
            emptyDescription={SITE_COPY.emptyCatalogBody}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
