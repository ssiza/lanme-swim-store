import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

import { getDefaultCountryCode } from "@lib/constants/region"
import {
  hasAcceptableCountryPrefix,
  isCountryPathSegment,
  logRegionResolution,
  resolveFallbackCountry,
  stripLeadingCountrySegment,
} from "@lib/util/region-resolution"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = getDefaultCountryCode()

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    console.error(
      JSON.stringify({
        event: "storefront.region_resolution",
        source: "middleware",
        reason: "missing_NEXT_PUBLIC_MEDUSA_BACKEND_URL",
        fallbackCountry: DEFAULT_REGION,
      })
    )
    return regionMapCache.regionMap
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    try {
      const response = await fetch(`${BACKEND_URL}/store/regions`, {
        method: "GET",
        headers: {
          "x-publishable-api-key": PUBLISHABLE_API_KEY!,
        },
        next: {
          revalidate: 3600,
          tags: [`regions-${cacheId}`],
        },
        cache: "force-cache",
      })

      if (!response.ok) {
        console.error(
          JSON.stringify({
            event: "storefront.region_resolution",
            source: "middleware",
            reason: "regions_fetch_failed",
            status: response.status,
            backendUrl: BACKEND_URL,
            fallbackCountry: DEFAULT_REGION,
          })
        )
        return regionMapCache.regionMap
      }

      const json = await response.json()
      const { regions } = json

      regionMapCache.regionMap = new Map<string, HttpTypes.StoreRegion>()

      if (!regions?.length) {
        console.error(
          JSON.stringify({
            event: "storefront.region_resolution",
            source: "middleware",
            reason: "regions_empty",
            backendUrl: BACKEND_URL,
            fallbackCountry: DEFAULT_REGION,
          })
        )
        return regionMapCache.regionMap
      }

      regions.forEach((region: HttpTypes.StoreRegion) => {
        region.countries?.forEach((c) => {
          if (c.iso_2) {
            regionMapCache.regionMap.set(c.iso_2.toLowerCase(), region)
          }
        })
      })

      regionMapCache.regionMapUpdated = Date.now()
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "storefront.region_resolution",
          source: "middleware",
          reason: "regions_fetch_error",
          backendUrl: BACKEND_URL,
          fallbackCountry: DEFAULT_REGION,
          error: error instanceof Error ? error.message : String(error),
        })
      )
    }
  }

  return regionMapCache.regionMap
}

function resolveCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion>
) {
  const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

  if (urlCountryCode && regionMap.has(urlCountryCode)) {
    return { countryCode: urlCountryCode, reason: "url_country_valid" }
  }

  if (urlCountryCode && isCountryPathSegment(urlCountryCode)) {
    return {
      countryCode: resolveFallbackCountry(regionMap, DEFAULT_REGION),
      reason: "url_country_invalid",
    }
  }

  const cloudflareCountryCode = (
    request as { cf?: { country?: string } }
  ).cf?.country?.toLowerCase()

  const vercelCountryCode = request.headers
    .get("x-vercel-ip-country")
    ?.toLowerCase()

  if (cloudflareCountryCode && regionMap.has(cloudflareCountryCode)) {
    return { countryCode: cloudflareCountryCode, reason: "cloudflare_geo" }
  }

  if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
    return { countryCode: vercelCountryCode, reason: "vercel_geo" }
  }

  return {
    countryCode: resolveFallbackCountry(regionMap, DEFAULT_REGION),
    reason: "default_fallback",
  }
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const cacheIdCookie = request.cookies.get("_medusa_cache_id")
  const cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap(cacheId)
  const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()
  const { countryCode, reason } = resolveCountryCode(request, regionMap)
  const country = countryCode || DEFAULT_REGION
  const resolvedRegion = regionMap.get(country)

  logRegionResolution({
    source: "middleware",
    incomingCountryCode: urlCountryCode,
    resolvedCountryCode: country,
    resolvedRegionId: resolvedRegion?.id,
    fallbackCountry: DEFAULT_REGION,
    backendUrl: BACKEND_URL,
    regionMapSize: regionMap.size,
    reason,
  })

  const firstPathSegment = urlCountryCode
  // regionMap.has(...) alone loops forever when Medusa regions cannot be loaded
  // (empty map): /us → resolve "us" → not in map → redirect /us → …
  const urlHasAcceptableCountry = hasAcceptableCountryPrefix(
    firstPathSegment,
    country,
    regionMap
  )

  if (urlHasAcceptableCountry) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-pathname", request.nextUrl.pathname)

    if (!cacheIdCookie) {
      const response = NextResponse.next({
        request: { headers: requestHeaders },
      })
      response.cookies.set("_medusa_cache_id", cacheId, {
        maxAge: 60 * 60 * 24,
      })
      return response
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  const redirectPath = stripLeadingCountrySegment(request.nextUrl.pathname)
  const queryString = request.nextUrl.search || ""
  const redirectUrl = `${request.nextUrl.origin}/${country}${redirectPath}${queryString}`

  // Absolute last resort against same-URL redirect loops.
  if (redirectUrl === request.nextUrl.href) {
    return NextResponse.next()
  }

  return NextResponse.redirect(redirectUrl, 307)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon\\.png|icon\\.svg|apple-icon\\.png|opengraph-image\\.jpg|twitter-image\\.jpg|manifest.json|web-app-manifest|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
