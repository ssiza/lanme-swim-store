import {
  DISCOVERY_CACHE_TAGS,
  PRODUCT_DISCOVERY_REVALIDATE,
  type DiscoveryCacheTag,
} from "@lib/constants/cache"
import { getCacheTag } from "@lib/data/cookies"

export type FetchCacheMode = "force-cache" | "no-store"

export type CacheFetchLogContext = {
  route: string
  fetchUrl: string
  cacheMode: FetchCacheMode
  revalidate?: number | null
  tags?: string[]
  returnedCount?: number | null
}

/**
 * ISR cache options for product discovery data (store, collections, categories, rails).
 * Merges global tags with per-session tags when a cache cookie is present.
 */
export async function getDiscoveryCacheNext(
  tag: DiscoveryCacheTag
): Promise<{ revalidate: number; tags: string[] }> {
  const globalTag = DISCOVERY_CACHE_TAGS[tag]
  const sessionTag = await getCacheTag(tag)
  const tags = sessionTag ? [globalTag, sessionTag] : [globalTag]

  return {
    revalidate: PRODUCT_DISCOVERY_REVALIDATE,
    tags,
  }
}

export function logCacheFetch(
  phase: "start" | "end",
  context: CacheFetchLogContext
) {
  const payload = {
    event:
      phase === "start"
        ? "storefront.cache_fetch.start"
        : "storefront.cache_fetch.end",
    route: context.route,
    fetchUrl: context.fetchUrl,
    cacheMode: context.cacheMode,
    revalidate: context.revalidate ?? null,
    tags: context.tags ?? [],
    returnedCount: context.returnedCount ?? null,
    timestamp: new Date().toISOString(),
  }

  console.log(JSON.stringify(payload))
}
