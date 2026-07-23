"use server"

import { getDefaultCountryCode } from "@lib/constants/region"
import {
  logFetchEnd,
  logFetchError,
  logFetchStart,
} from "@lib/util/storefront-fetch-log"
import { logRegionResolution } from "@lib/util/region-resolution"
import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

export const listRegions = async () => {
  logFetchStart("listRegions")

  try {
    const regions = await sdk.client
      .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
        method: "GET",
        cache: "no-store",
      })
      .then(({ regions }) => regions ?? [])

    logFetchEnd("listRegions", { count: regions.length })
    return regions
  } catch (error) {
    logFetchError("listRegions", error)
    logRegionResolution({
      source: "server",
      resolvedCountryCode: getDefaultCountryCode(),
      fallbackCountry: getDefaultCountryCode(),
      reason: "list_regions_failed",
    })
    return null
  }
}

export const retrieveRegion = async (id: string) => {
  logFetchStart("retrieveRegion", { regionId: id })

  try {
    return await sdk.client
      .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
        method: "GET",
        cache: "no-store",
      })
      .then(({ region }) => region)
  } catch (error) {
    logFetchError("retrieveRegion", error, { regionId: id })
    return null
  }
}

const regionMap = new Map<string, HttpTypes.StoreRegion>()

const populateRegionMap = (regions: HttpTypes.StoreRegion[]) => {
  regionMap.clear()

  regions.forEach((region) => {
    region.countries?.forEach((c) => {
      if (c?.iso_2) {
        regionMap.set(c.iso_2.toLowerCase(), region)
      }
    })
  })
}

export const getRegion = async (countryCode: string) => {
  logFetchStart("getRegion", { countryCode })

  const normalizedCountryCode = countryCode?.toLowerCase()
  const fallbackCountry = getDefaultCountryCode()

  if (regionMap.has(normalizedCountryCode)) {
    const region = regionMap.get(normalizedCountryCode)

    logRegionResolution({
      source: "server",
      incomingCountryCode: normalizedCountryCode,
      resolvedCountryCode: normalizedCountryCode,
      resolvedRegionId: region?.id,
      fallbackCountry,
      reason: "region_map_cache_hit",
    })

    logFetchEnd("getRegion", {
      countryCode: normalizedCountryCode,
      regionId: region?.id,
      reason: "cache_hit",
    })

    return region ?? null
  }

  const regions = await listRegions()

  if (!regions?.length) {
    logRegionResolution({
      source: "server",
      incomingCountryCode: normalizedCountryCode,
      resolvedCountryCode: normalizedCountryCode,
      fallbackCountry,
      reason: "regions_unavailable",
    })
    logFetchEnd("getRegion", {
      countryCode: normalizedCountryCode,
      ok: false,
      reason: "regions_unavailable",
    })
    return null
  }

  populateRegionMap(regions)

  const region = regionMap.get(normalizedCountryCode) ?? null

  logRegionResolution({
    source: "server",
    incomingCountryCode: normalizedCountryCode,
    resolvedCountryCode: normalizedCountryCode,
    resolvedRegionId: region?.id,
    fallbackCountry,
    regionMapSize: regionMap.size,
    reason: region ? "region_resolved" : "region_not_found",
  })

  logFetchEnd("getRegion", {
    countryCode: normalizedCountryCode,
    regionId: region?.id,
    reason: region ? "resolved" : "not_found",
  })

  return region
}
