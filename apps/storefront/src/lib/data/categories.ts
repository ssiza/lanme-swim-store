"use server"

import { sdk } from "@lib/config"
import {
  logFetchEnd,
  logFetchError,
  logFetchStart,
} from "@lib/util/storefront-fetch-log"
import {
  getDiscoveryCacheNext,
  logCacheFetch,
} from "@lib/util/fetch-cache"
import { HttpTypes } from "@medusajs/types"

export const listCategories = async (
  query?: Record<string, unknown>,
  route = "listCategories"
) => {
  logFetchStart("listCategories", { query })

  const next = await getDiscoveryCacheNext("categories")
  const fetchUrl = "/store/product-categories"
  const limit = query?.limit || 100

  logCacheFetch("start", {
    route,
    fetchUrl,
    cacheMode: "force-cache",
    revalidate: next.revalidate,
    tags: next.tags,
  })

  try {
    const product_categories = await sdk.client
      .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
        fetchUrl,
        {
          query: {
            fields:
              "*category_children, *products, *parent_category, *parent_category.parent_category",
            limit,
            ...query,
          },
          next,
          cache: "force-cache",
        }
      )
      .then(({ product_categories }) => product_categories ?? [])

    logCacheFetch("end", {
      route,
      fetchUrl,
      cacheMode: "force-cache",
      revalidate: next.revalidate,
      tags: next.tags,
      returnedCount: product_categories.length,
    })

    logFetchEnd("listCategories", { count: product_categories.length })
    return product_categories
  } catch (error) {
    logFetchError("listCategories", error, { query })
    return []
  }
}

export const getCategoryByHandle = async (
  categoryHandle: string[],
  route?: string
) => {
  const handle = `${categoryHandle.join("/")}`
  const resolvedRoute = route ?? `/categories/${handle}`

  logFetchStart("getCategoryByHandle", { handle })

  const next = await getDiscoveryCacheNext("categories")
  const fetchUrl = "/store/product-categories"

  logCacheFetch("start", {
    route: resolvedRoute,
    fetchUrl,
    cacheMode: "force-cache",
    revalidate: next.revalidate,
    tags: next.tags,
  })

  try {
    const category = await sdk.client
      .fetch<HttpTypes.StoreProductCategoryListResponse>(fetchUrl, {
        query: {
          fields:
            "*category_children, *products, *parent_category, *parent_category.parent_category",
          handle,
        },
        next,
        cache: "force-cache",
      })
      .then(({ product_categories }) => product_categories?.[0] ?? null)

    logCacheFetch("end", {
      route: resolvedRoute,
      fetchUrl,
      cacheMode: "force-cache",
      revalidate: next.revalidate,
      tags: next.tags,
      returnedCount: category ? 1 : 0,
    })

    logFetchEnd("getCategoryByHandle", { handle, found: Boolean(category) })
    return category
  } catch (error) {
    logFetchError("getCategoryByHandle", error, { handle })
    return null
  }
}
