"use server"

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

export type HomepageFooterLink = {
  label: string
  href: string
}

export type HomepageSettings = {
  hero_background_image_url: string | null
  hero_slides: HomepageHeroSlide[]
  featured_categories: HomepageCategoryBanner[]
  featured_collections: HomepageCollectionBlock[]
  footer_about: string | null
  footer_address: string | null
  footer_links: HomepageFooterLink[]
  footer_support_links: HomepageFooterLink[]
  footer_about_links: HomepageFooterLink[]
  footer_configured: boolean
}

const EMPTY_SETTINGS: HomepageSettings = {
  hero_background_image_url: null,
  hero_slides: [],
  featured_categories: [],
  featured_collections: [],
  footer_about: null,
  footer_address: null,
  footer_links: [],
  footer_support_links: [],
  footer_about_links: [],
  footer_configured: false,
}

const normalizeSettings = (settings: HomepageSettings): HomepageSettings => {
  const hero_slides = Array.isArray(settings.hero_slides)
    ? settings.hero_slides
    : []

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
    footer_support_links: Array.isArray(settings.footer_support_links)
      ? settings.footer_support_links
      : [],
    footer_about_links: Array.isArray(settings.footer_about_links)
      ? settings.footer_about_links
      : [],
    footer_configured: Boolean(settings.footer_configured),
    footer_about:
      typeof settings.footer_about === "string" ? settings.footer_about : null,
    footer_address:
      typeof settings.footer_address === "string"
        ? settings.footer_address
        : null,
  }
}

/**
 * Fetch homepage CMS from the public backend route (no publishable key).
 * Falls back to /store/homepage if the public route is unavailable.
 */
export const getHomepageSettings = async (): Promise<HomepageSettings> => {
  logFetchStart("getHomepageSettings")

  const next = await getDiscoveryCacheNext("homepage")
  const backendUrl = (
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  ).replace(/\/$/, "")

  const candidates = [
    `${backendUrl}/storefront/homepage`,
    `${backendUrl}/store/homepage`,
  ]

  for (const fetchUrl of candidates) {
    logCacheFetch("start", {
      route: "/homepage",
      fetchUrl,
      cacheMode: "force-cache",
      revalidate: next.revalidate,
      tags: next.tags,
    })

    try {
      const response = await fetch(fetchUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          // Harmless on the public route; required if we fall back to /store/*.
          ...(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
            ? {
                "x-publishable-api-key":
                  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
              }
            : {}),
        },
        next,
        cache: "force-cache",
      })

      if (!response.ok) {
        logFetchError("getHomepageSettings", new Error(`HTTP ${response.status}`), {
          fetchUrl,
        })
        continue
      }

      const settings = (await response.json()) as HomepageSettings
      const normalized = normalizeSettings(settings)

      logCacheFetch("end", {
        route: "/homepage",
        fetchUrl,
        cacheMode: "force-cache",
        revalidate: next.revalidate,
        tags: next.tags,
        returnedCount: 1,
      })

      logFetchEnd("getHomepageSettings", {
        fetchUrl,
        hasHeroImage: Boolean(
          normalized.hero_slides[0]?.desktop_image_url ||
            normalized.hero_background_image_url
        ),
        slideCount: normalized.hero_slides.length,
        categoryBannerCount: normalized.featured_categories.length,
        collectionBlockCount: normalized.featured_collections.length,
        hasFooterAbout: Boolean(normalized.footer_about),
        footerConfigured: Boolean(normalized.footer_configured),
      })

      return normalized
    } catch (error) {
      logFetchError("getHomepageSettings", error, { fetchUrl })
    }
  }

  return EMPTY_SETTINGS
}
