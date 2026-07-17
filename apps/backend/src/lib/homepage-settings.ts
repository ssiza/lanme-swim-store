export const HERO_BACKGROUND_IMAGE_METADATA_KEY = "hero_background_image_url"
export const HERO_SLIDES_METADATA_KEY = "homepage_hero_slides"

export type HeroSlide = {
  id: string
  desktop_image_url: string | null
  mobile_image_url: string | null
  headline: string | null
  subheadline: string | null
  cta_label: string | null
  cta_href: string | null
  sort_order: number
}

export type HomepageSettings = {
  hero_background_image_url: string | null
  hero_slides: HeroSlide[]
}

const asTrimmedString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const asSortOrder = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

export const createEmptyHeroSlide = (sortOrder = 0): HeroSlide => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `slide_${Date.now()}_${sortOrder}`,
  desktop_image_url: null,
  mobile_image_url: null,
  headline: null,
  subheadline: null,
  cta_label: null,
  cta_href: null,
  sort_order: sortOrder,
})

const normalizeHeroSlide = (value: unknown, index: number): HeroSlide | null => {
  if (!value || typeof value !== "object") {
    return null
  }

  const raw = value as Record<string, unknown>
  const desktop =
    asTrimmedString(raw.desktop_image_url) ??
    asTrimmedString(raw.image_url) ??
    asTrimmedString(raw.background_image_url)
  const mobile = asTrimmedString(raw.mobile_image_url)

  const slide: HeroSlide = {
    id: asTrimmedString(raw.id) ?? `slide_${index}`,
    desktop_image_url: desktop,
    mobile_image_url: mobile,
    headline: asTrimmedString(raw.headline),
    subheadline: asTrimmedString(raw.subheadline),
    cta_label: asTrimmedString(raw.cta_label),
    cta_href: asTrimmedString(raw.cta_href),
    sort_order: asSortOrder(raw.sort_order, index),
  }

  const hasContent =
    slide.desktop_image_url ||
    slide.mobile_image_url ||
    slide.headline ||
    slide.subheadline ||
    slide.cta_label ||
    slide.cta_href

  return hasContent ? slide : null
}

export const getHeroBackgroundImageUrl = (
  metadata: Record<string, unknown> | null | undefined
): string | null => {
  return asTrimmedString(metadata?.[HERO_BACKGROUND_IMAGE_METADATA_KEY])
}

export const getHeroSlides = (
  metadata: Record<string, unknown> | null | undefined
): HeroSlide[] => {
  const raw = metadata?.[HERO_SLIDES_METADATA_KEY]
  let parsed: unknown = raw

  if (typeof raw === "string" && raw.trim()) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = []
    }
  }

  const slides = Array.isArray(parsed)
    ? parsed
        .map((item, index) => normalizeHeroSlide(item, index))
        .filter((slide): slide is HeroSlide => Boolean(slide))
        .sort((a, b) => a.sort_order - b.sort_order)
    : []

  if (slides.length > 0) {
    return slides
  }

  // Backward compatibility: single legacy hero image becomes slide 0.
  const legacyImage = getHeroBackgroundImageUrl(metadata)
  if (legacyImage) {
    return [
      {
        ...createEmptyHeroSlide(0),
        id: "legacy_hero",
        desktop_image_url: legacyImage,
      },
    ]
  }

  return []
}

export const serializeHeroSlides = (slides: HeroSlide[]): string => {
  const normalized = slides
    .map((slide, index) => normalizeHeroSlide(slide, index))
    .filter((slide): slide is HeroSlide => Boolean(slide))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((slide, index) => ({
      ...slide,
      sort_order: index,
    }))

  return JSON.stringify(normalized)
}

export const getHomepageHeroSettings = (
  metadata: Record<string, unknown> | null | undefined
): HomepageSettings => {
  const hero_slides = getHeroSlides(metadata)
  return {
    hero_background_image_url:
      hero_slides[0]?.desktop_image_url ?? getHeroBackgroundImageUrl(metadata),
    hero_slides,
  }
}
