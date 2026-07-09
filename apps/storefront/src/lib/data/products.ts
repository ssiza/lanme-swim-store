"use server"

import { sdk } from "@lib/config"
import {
  extractProductQueryFilters,
  logFetchEnd,
  logFetchError,
  logFetchStart,
  logProductQuery,
} from "@lib/util/storefront-fetch-log"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { GRID_PRODUCTS_PAGE_SIZE } from "@lib/constants/products"
import { getAuthHeaders } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"
import {
  getDiscoveryCacheNext,
  logCacheFetch,
} from "@lib/util/fetch-cache"

const emptyProductsResult = (
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
) => ({
  response: { products: [] as HttpTypes.StoreProduct[], count: 0 },
  nextPage: null as number | null,
  queryParams,
})

const PRODUCT_DETAIL_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,*images,*collection,*categories"

const normalizeArrayFilter = (
  value: string | string[] | undefined
): string[] | undefined => {
  if (!value) {
    return undefined
  }

  return Array.isArray(value) ? value : [value]
}

const fetchAllMatchingProducts = async ({
  queryParams,
  countryCode,
  route,
  collectionHandle,
  categoryHandle,
  batchSize = 100,
  maxProducts = 500,
}: {
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode: string
  route: string
  collectionHandle?: string | null
  categoryHandle?: string | null
  batchSize?: number
  maxProducts?: number
}): Promise<{ products: HttpTypes.StoreProduct[]; count: number }> => {
  const products: HttpTypes.StoreProduct[] = []
  let count = 0
  let page = 1

  while (products.length < maxProducts) {
    const {
      response: { products: batch, count: total },
    } = await listProducts({
      pageParam: page,
      queryParams: {
        ...queryParams,
        limit: batchSize,
      },
      countryCode,
      route,
      collectionHandle,
      categoryHandle,
    })

    count = total

    if (!batch.length) {
      break
    }

    products.push(...batch)

    if (products.length >= total) {
      break
    }

    page += 1
  }

  return {
    products: products.slice(0, maxProducts),
    count,
  }
}

export async function getProductByHandle({
  handle,
  regionId,
  countryCode,
  fields = PRODUCT_DETAIL_FIELDS,
}: {
  handle: string
  regionId?: string
  countryCode?: string
  fields?: string
}): Promise<HttpTypes.StoreProduct | null> {
  let region: HttpTypes.StoreRegion | null | undefined

  if (regionId) {
    region = await retrieveRegion(regionId)
  } else if (countryCode) {
    region = await getRegion(countryCode)
  }

  if (!region) {
    logFetchEnd("getProductByHandle", {
      handle,
      countryCode,
      regionId,
      ok: false,
      reason: "no_region",
      productsCount: 0,
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY),
    })
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const query = {
    handle,
    region_id: region.id,
    limit: 1,
    fields,
  }

  logFetchStart("getProductByHandle", {
    handle,
    countryCode,
    regionId: region.id,
    hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY),
    query,
  })

  try {
    const fetchUrl = `/store/products`
    const next = await getDiscoveryCacheNext("products")

    logCacheFetch("start", {
      route: countryCode ? `/${countryCode}/products/${handle}` : `/products/${handle}`,
      fetchUrl,
      cacheMode: "force-cache",
      revalidate: next.revalidate,
      tags: next.tags,
    })

    const res = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
      count: number
    }>(fetchUrl, {
      method: "GET",
      query,
      headers,
      next,
      cache: "force-cache",
    })

    const product = res.products?.[0] ?? null

    logCacheFetch("end", {
      route: countryCode ? `/${countryCode}/products/${handle}` : `/products/${handle}`,
      fetchUrl,
      cacheMode: "force-cache",
      revalidate: next.revalidate,
      tags: next.tags,
      returnedCount: res.products?.length ?? 0,
    })

    logFetchEnd("getProductByHandle", {
      handle,
      countryCode,
      regionId: region.id,
      productsCount: res.products?.length ?? 0,
      productId: product?.id,
      httpStatus: 200,
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY),
    })

    return product
  } catch (error) {
    const httpStatus =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : undefined

    logFetchError("getProductByHandle", error, {
      handle,
      countryCode,
      regionId: region.id,
      httpStatus,
      productsCount: 0,
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY),
      query,
    })

    return null
  }
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  route = "listProducts",
  collectionHandle,
  categoryHandle,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
  route?: string
  collectionHandle?: string | null
  categoryHandle?: string | null
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}> => {
  if (!countryCode && !regionId) {
    logFetchError("listProducts", new Error("Country code or region ID is required"), {
      countryCode,
      regionId,
      route,
    })
    return emptyProductsResult(queryParams)
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    logProductQuery("end", {
      route,
      countryCode,
      regionId: regionId ?? undefined,
      ...extractProductQueryFilters(queryParams),
      limit,
      offset,
      returnedCount: 0,
      totalCount: 0,
    })

    return emptyProductsResult(queryParams)
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = await getDiscoveryCacheNext("products")
  const fetchUrl = `/store/products`

  logCacheFetch("start", {
    route,
    fetchUrl,
    cacheMode: "force-cache",
    revalidate: next.revalidate,
    tags: next.tags,
  })

  const normalizedQueryParams = { ...queryParams }

  if (normalizedQueryParams.collection_id) {
    normalizedQueryParams.collection_id = normalizeArrayFilter(
      normalizedQueryParams.collection_id as string | string[]
    )
  }

  if (normalizedQueryParams.category_id) {
    normalizedQueryParams.category_id = normalizeArrayFilter(
      normalizedQueryParams.category_id as string | string[]
    )
  }

  if (normalizedQueryParams.tag_id) {
    normalizedQueryParams.tag_id = normalizeArrayFilter(
      normalizedQueryParams.tag_id as string | string[]
    )
  }

  const requestQuery = {
    limit,
    offset,
    region_id: region.id,
    fields:
      "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,",
    ...normalizedQueryParams,
  }

  const filters = extractProductQueryFilters(requestQuery)

  logProductQuery("start", {
    route,
    countryCode,
    regionId: region.id,
    collectionId: filters.collectionId ?? null,
    collectionHandle: collectionHandle ?? null,
    categoryId: filters.categoryId ?? null,
    categoryHandle: categoryHandle ?? null,
    tagId: filters.tagId ?? null,
    limit,
    offset,
  })

  logFetchStart("listProducts", {
    route,
    countryCode,
    regionId: region.id,
    pageParam,
    hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY),
    query: requestQuery,
  })

  try {
    const response = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
      count: number
    }>(`/store/products`, {
      method: "GET",
      query: requestQuery,
      headers,
      next,
      cache: "force-cache",
    })

    const { products, count } = response

    const safeProducts = products ?? []
    const safeCount = count ?? safeProducts.length
    const nextPage = safeCount > offset + limit ? pageParam + 1 : null

    logProductQuery("end", {
      route,
      countryCode,
      regionId: region.id,
      collectionId: filters.collectionId ?? null,
      collectionHandle: collectionHandle ?? null,
      categoryId: filters.categoryId ?? null,
      categoryHandle: categoryHandle ?? null,
      tagId: filters.tagId ?? null,
      limit,
      offset,
      returnedCount: safeProducts.length,
      totalCount: safeCount,
    })

    logCacheFetch("end", {
      route,
      fetchUrl,
      cacheMode: "force-cache",
      revalidate: next.revalidate,
      tags: next.tags,
      returnedCount: safeProducts.length,
    })

    logFetchEnd("listProducts", {
      route,
      countryCode,
      regionId: region.id,
      count: safeCount,
      productCount: safeProducts.length,
      handles: safeProducts.map((product) => product.handle),
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY),
      query: requestQuery,
    })

    return {
      response: {
        products: safeProducts,
        count: safeCount,
      },
      nextPage,
      queryParams,
    }
  } catch (error) {
    const httpStatus =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : undefined

    logProductQuery("error", {
      route,
      countryCode,
      regionId: region.id,
      ...filters,
      limit,
      offset,
      error: error instanceof Error ? error.message : String(error),
    })

    logFetchError("listProducts", error, {
      route,
      countryCode,
      regionId: region.id,
      httpStatus,
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY),
      query: requestQuery,
    })
    return emptyProductsResult(queryParams)
  }
}

export const listProductsWithSort = async ({
  page = 1,
  queryParams,
  sortBy = "created_at",
  countryCode,
  route = "listProductsWithSort",
  collectionHandle,
  categoryHandle,
  pageSize = GRID_PRODUCTS_PAGE_SIZE,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
  route?: string
  collectionHandle?: string | null
  categoryHandle?: string | null
  pageSize?: number
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const currentPage = Math.max(page, 1)

  const { products, count } = await fetchAllMatchingProducts({
    queryParams,
    countryCode,
    route,
    collectionHandle,
    categoryHandle,
  })

  const sortedProducts = sortProducts(products, sortBy)
  const offset = (currentPage - 1) * pageSize
  const paginatedProducts = sortedProducts.slice(offset, offset + pageSize)
  const nextPage = count > offset + pageSize ? currentPage + 1 : null

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}
