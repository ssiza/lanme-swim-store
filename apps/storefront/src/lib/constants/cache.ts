/** Time-based revalidation for product discovery pages and fetches (seconds). */
export const PRODUCT_DISCOVERY_REVALIDATE = 60

/** Global Next.js cache tags, not tied to per-session cookies. */
export const DISCOVERY_CACHE_TAGS = {
  products: "storefront-products",
  collections: "storefront-collections",
  categories: "storefront-categories",
  homepage: "storefront-homepage",
} as const

export type DiscoveryCacheTag = keyof typeof DISCOVERY_CACHE_TAGS
