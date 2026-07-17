import { DEFAULT_COUNTRY_CODE, getDefaultCountryCode } from "@lib/constants/region"
import { getBaseURL } from "@lib/util/env"

type RegionResolutionLog = {
  source: "middleware" | "server"
  incomingCountryCode?: string
  resolvedCountryCode: string
  resolvedRegionId?: string
  fallbackCountry: string
  backendUrl?: string
  regionMapSize?: number
  reason: string
}

export const logRegionResolution = (payload: RegionResolutionLog) => {
  console.log(
    JSON.stringify({
      event: "storefront.region_resolution",
      ...payload,
      backendUrl:
        payload.backendUrl ??
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ??
        "unset",
      fallbackCountry: payload.fallbackCountry ?? getDefaultCountryCode(),
    })
  )
}

/** True when the first path segment looks like an ISO country code. */
export const isCountryPathSegment = (segment: string | undefined): boolean =>
  Boolean(segment && segment.length === 2 && /^[a-z]{2}$/.test(segment))

/**
 * Strip a leading country segment from a pathname when redirecting to a valid country.
 * /dk/store -> /store, /us/store -> /store, /store -> /store
 */
export const stripLeadingCountrySegment = (pathname: string): string => {
  const parts = pathname.split("/").filter(Boolean)

  if (parts.length === 0) {
    return ""
  }

  if (isCountryPathSegment(parts[0])) {
    const rest = parts.slice(1).join("/")
    return rest ? `/${rest}` : ""
  }

  return pathname === "/" ? "" : pathname
}

export const resolveFallbackCountry = (
  regionMap: Map<string, unknown>,
  preferred = getDefaultCountryCode()
): string => {
  const normalizedPreferred = preferred.toLowerCase()

  if (regionMap.has(normalizedPreferred)) {
    return normalizedPreferred
  }

  const first = regionMap.keys().next().value

  if (typeof first === "string" && first.length > 0) {
    return first
  }

  return DEFAULT_COUNTRY_CODE
}

/**
 * Whether the request path already has an acceptable country prefix and should
 * NOT redirect. When the region map is empty (backend/key failure), allow the
 * fallback country through so we never 307 to the same URL forever.
 */
export const hasAcceptableCountryPrefix = (
  pathCountry: string | undefined,
  resolvedCountry: string,
  regionMap: Map<string, unknown>
): boolean => {
  if (!pathCountry || pathCountry !== resolvedCountry.toLowerCase()) {
    return false
  }

  if (regionMap.size === 0) {
    return true
  }

  return regionMap.has(pathCountry)
}
