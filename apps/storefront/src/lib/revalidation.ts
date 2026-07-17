import { revalidatePath, revalidateTag } from "next/cache"

import {
  DISCOVERY_CACHE_TAGS,
  type DiscoveryCacheTag,
} from "@lib/constants/cache"

type RevalidatePayload = {
  tags?: DiscoveryCacheTag[]
  paths?: string[]
  productHandle?: string | null
  countryCodes?: string[]
}

const defaultCountryCodes = (): string[] => {
  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_REGION
  return fromEnv ? [fromEnv.toLowerCase()] : ["us"]
}

export function revalidateDiscoveryCache(payload: RevalidatePayload = {}) {
  const tags = payload.tags ?? [
    "products",
    "collections",
    "categories",
    "homepage",
  ]

  for (const tag of tags) {
    revalidateTag(DISCOVERY_CACHE_TAGS[tag])
  }

  const countryCodes = payload.countryCodes?.length
    ? payload.countryCodes.map((code) => code.toLowerCase())
    : defaultCountryCodes()

  const explicitPaths = payload.paths ?? []

  for (const countryCode of countryCodes) {
    explicitPaths.push(
      `/${countryCode}`,
      `/${countryCode}/store`,
      `/${countryCode}/collections`
    )

    // Layout includes the footer (CMS about/links) — bust it on homepage/store updates.
    revalidatePath(`/${countryCode}`, "layout")
    revalidatePath(`/${countryCode}/categories`, "layout")

    if (payload.productHandle) {
      explicitPaths.push(`/${countryCode}/products/${payload.productHandle}`)
    }
  }

  for (const path of [...new Set(explicitPaths)]) {
    revalidatePath(path)
  }

  return {
    ok: true,
    revalidatedAt: new Date().toISOString(),
    tags: tags.map((tag) => DISCOVERY_CACHE_TAGS[tag]),
    paths: [...new Set(explicitPaths)],
  }
}
