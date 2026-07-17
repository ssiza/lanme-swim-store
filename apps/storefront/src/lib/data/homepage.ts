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

export type HomepageHeroSlide = {
  id: string
  desktop_image_url: string | null
  mobile_image_url: string | null
  headline: string | null
  subheadline: string | null
  cta_label: string | null
  cta_href: string | null
  sort_order: number
}

export type HomepageCategoryBanner = {
  id: string
  handle: string
  name: string
  title: string
  subtitle: string | null
  cover_image_url: string
  mobile_cover_image_url: string | null
  display_order: number
  href: string
}

export type HomepageCollectionBlock = {
  id: string
  handle: string
  title: string
  promo_headline: string | null
  description: string | null
  cover_image_url: string | null
  mobile_image_url: string | null
  cta_label: string | null
  cta_href: string
  display_order: number
  featured_on_homepage: boolean
  show_products_on_homepage: boolean
  explicitly_configured?: boolean
}

export type HomepageSettings = {
  hero_background_image_url: string | null
  hero_slides: HomepageHeroSlide[]
  featured_categories: HomepageCategoryBanner[]
  featured_collections: HomepageCollectionBlock[]
  footer_about: string | null
  footer_address: string | null
  footer_links: Array<{ label: string; href: string }>
}

const EMPTY_SETTINGS: HomepageSettings = {
  hero_background_image_url: null,
  hero_slides: [],
  featured_categories: [],
  featured_collections: [],
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

    const hero_slides = Array.isArray(settings.hero_slides)
      ? settings.hero_slides
      : []

    // Legacy single-image fallback when slides array is empty.
    if (
      hero_slides.length === 0 &&
      typeof settings.hero_background_image_url === "string" &&
      settings.hero_background_image_url.trim()
    ) {
      hero_slides.push({
        id: "legacy_hero",
        desktop_image_url: settings.hero_background_image_url,
        mobile_image_url: null,
        headline: null,
        subheadline: null,
        cta_label: null,
        cta_href: null,
        sort_order: 0,
      })
    }

    logCacheFetch("end", {
      route: "/homepage",
      fetchUrl,
      cacheMode: "force-cache",
      revalidate: next.revalidate,
      tags: next.tags,
      returnedCount: 1,
    })

    logFetchEnd("getHomepageSettings", {
      hasHeroImage: Boolean(
        hero_slides[0]?.desktop_image_url || settings.hero_background_image_url
      ),
      slideCount: hero_slides.length,
      categoryBannerCount: settings.featured_categories?.length ?? 0,
      collectionBlockCount: settings.featured_collections?.length ?? 0,
      hasFooterAbout: Boolean(settings.footer_about),
    })

    return {
      ...EMPTY_SETTINGS,
      ...settings,
      hero_slides,
      featured_categories: Array.isArray(settings.featured_categories)
        ? settings.featured_categories
        : [],
      featured_collections: Array.isArray(settings.featured_collections)
        ? settings.featured_collections
        : [],
      footer_links: Array.isArray(settings.footer_links)
        ? settings.footer_links
        : [],
    }
  } catch (error) {
    logFetchError("getHomepageSettings", error)
    return EMPTY_SETTINGS
  }
}
