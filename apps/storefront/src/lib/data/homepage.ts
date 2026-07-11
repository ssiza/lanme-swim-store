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

export type HomepageSettings = {
  hero_background_image_url: string | null
  footer_about: string | null
  footer_address: string | null
  footer_links: Array<{ label: string; href: string }>
}

const EMPTY_SETTINGS: HomepageSettings = {
  hero_background_image_url: null,
  footer_about: null,
  footer_address: null,
  footer_links: [],
}

export const getHomepageSettings = async (): Promise<HomepageSettings> => {
  logFetchStart("getHomepageSettings")

  const next = await getDiscoveryCacheNext("homepage")
  const fetchUrl = "/store/homepage"

  logCacheFetch("start", {
    route: "/homepage",
    fetchUrl,
    cacheMode: "force-cache",
    revalidate: next.revalidate,
    tags: next.tags,
  })

  try {
    const settings = await sdk.client.fetch<HomepageSettings>(fetchUrl, {
      next,
      cache: "force-cache",
    })

    logCacheFetch("end", {
      route: "/homepage",
      fetchUrl,
      cacheMode: "force-cache",
      revalidate: next.revalidate,
      tags: next.tags,
      returnedCount: 1,
    })

    logFetchEnd("getHomepageSettings", {
      hasHeroImage: Boolean(settings.hero_background_image_url),
      hasFooterAbout: Boolean(settings.footer_about),
    })

    return {
      ...EMPTY_SETTINGS,
      ...settings,
      footer_links: Array.isArray(settings.footer_links)
        ? settings.footer_links
        : [],
    }
  } catch (error) {
    logFetchError("getHomepageSettings", error)
    return EMPTY_SETTINGS
  }
}
