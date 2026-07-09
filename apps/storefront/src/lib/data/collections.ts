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

const emptyCollections = (): {
  collections: HttpTypes.StoreCollection[]
  count: number
} => ({ collections: [], count: 0 })

export const retrieveCollection = async (id: string) => {
  logFetchStart("retrieveCollection", { collectionId: id })

  const next = await getDiscoveryCacheNext("collections")
  const fetchUrl = `/store/collections/${id}`

  logCacheFetch("start", {
    route: "retrieveCollection",
    fetchUrl,
    cacheMode: "force-cache",
    revalidate: next.revalidate,
    tags: next.tags,
  })

  try {
    const collection = await sdk.client
      .fetch<{ collection: HttpTypes.StoreCollection }>(fetchUrl, {
        next,
        cache: "force-cache",
      })
      .then(({ collection }) => collection)

    logCacheFetch("end", {
      route: "retrieveCollection",
      fetchUrl,
      cacheMode: "force-cache",
      revalidate: next.revalidate,
      tags: next.tags,
      returnedCount: collection ? 1 : 0,
    })

    logFetchEnd("retrieveCollection", { collectionId: id })
    return collection
  } catch (error) {
    logFetchError("retrieveCollection", error, { collectionId: id })
    return null
  }
}

export const listCollections = async (
  queryParams: Record<string, string> = {},
  route = "listCollections"
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  logFetchStart("listCollections", { queryParams })

  const next = await getDiscoveryCacheNext("collections")
  const fetchUrl = "/store/collections"

  queryParams.limit = queryParams.limit || "100"
  queryParams.offset = queryParams.offset || "0"

  logCacheFetch("start", {
    route,
    fetchUrl,
    cacheMode: "force-cache",
    revalidate: next.revalidate,
    tags: next.tags,
  })

  try {
    const { collections } = await sdk.client.fetch<{
      collections: HttpTypes.StoreCollection[]
      count: number
    }>(fetchUrl, {
      query: queryParams,
      next,
      cache: "force-cache",
    })

    const safeCollections = collections ?? []

    logCacheFetch("end", {
      route,
      fetchUrl,
      cacheMode: "force-cache",
      revalidate: next.revalidate,
      tags: next.tags,
      returnedCount: safeCollections.length,
    })

    logFetchEnd("listCollections", { count: safeCollections.length })

    return { collections: safeCollections, count: safeCollections.length }
  } catch (error) {
    logFetchError("listCollections", error, { queryParams })
    return emptyCollections()
  }
}

export const getCollectionByHandle = async (
  handle: string,
  route?: string
): Promise<HttpTypes.StoreCollection | null> => {
  logFetchStart("getCollectionByHandle", { handle })

  const next = await getDiscoveryCacheNext("collections")
  const fetchUrl = "/store/collections"
  const resolvedRoute = route ?? `/collections/${handle}`

  logCacheFetch("start", {
    route: resolvedRoute,
    fetchUrl,
    cacheMode: "force-cache",
    revalidate: next.revalidate,
    tags: next.tags,
  })

  try {
    const collection = await sdk.client
      .fetch<HttpTypes.StoreCollectionListResponse>(fetchUrl, {
        query: { handle, fields: "*products" },
        next,
        cache: "force-cache",
      })
      .then(({ collections }) => collections?.[0] ?? null)

    logCacheFetch("end", {
      route: resolvedRoute,
      fetchUrl,
      cacheMode: "force-cache",
      revalidate: next.revalidate,
      tags: next.tags,
      returnedCount: collection ? 1 : 0,
    })

    logFetchEnd("getCollectionByHandle", { handle, found: Boolean(collection) })
    return collection
  } catch (error) {
    logFetchError("getCollectionByHandle", error, { handle })
    return null
  }
}
