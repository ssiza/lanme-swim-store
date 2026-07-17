export const CATEGORY_COVER_IMAGE_METADATA_KEY = "homepage_cover_image_url"
export const CATEGORY_MOBILE_COVER_IMAGE_METADATA_KEY =
  "homepage_mobile_cover_image_url"
export const CATEGORY_SUBTITLE_METADATA_KEY = "homepage_subtitle"
export const CATEGORY_TITLE_OVERRIDE_METADATA_KEY = "homepage_title"
export const CATEGORY_DISPLAY_ORDER_METADATA_KEY = "homepage_display_order"
export const CATEGORY_FEATURED_METADATA_KEY = "homepage_featured"

export type CategoryHomepageSettings = {
  title: string | null
  subtitle: string | null
  cover_image_url: string | null
  mobile_cover_image_url: string | null
  display_order: number
  featured_on_homepage: boolean
}

const asTrimmedString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const asNumber = (value: unknown, fallback = 0): number => {
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

const asBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return normalized === "true" || normalized === "1" || normalized === "yes"
  }

  if (typeof value === "number") {
    return value === 1
  }

  return false
}

export const getCategoryHomepageSettings = (
  metadata: Record<string, unknown> | null | undefined,
  fallbackTitle?: string | null
): CategoryHomepageSettings => {
  return {
    title:
      asTrimmedString(metadata?.[CATEGORY_TITLE_OVERRIDE_METADATA_KEY]) ??
      asTrimmedString(fallbackTitle) ??
      null,
    subtitle: asTrimmedString(metadata?.[CATEGORY_SUBTITLE_METADATA_KEY]),
    cover_image_url: asTrimmedString(
      metadata?.[CATEGORY_COVER_IMAGE_METADATA_KEY]
    ),
    mobile_cover_image_url: asTrimmedString(
      metadata?.[CATEGORY_MOBILE_COVER_IMAGE_METADATA_KEY]
    ),
    display_order: asNumber(metadata?.[CATEGORY_DISPLAY_ORDER_METADATA_KEY], 0),
    featured_on_homepage: asBoolean(metadata?.[CATEGORY_FEATURED_METADATA_KEY]),
  }
}

export const toCategoryHomepageMetadata = (input: {
  title?: string | null
  subtitle?: string | null
  cover_image_url?: string | null
  mobile_cover_image_url?: string | null
  display_order?: number | string | null
  featured_on_homepage?: boolean
}): Record<string, string | number | boolean> => {
  return {
    [CATEGORY_TITLE_OVERRIDE_METADATA_KEY]: asTrimmedString(input.title) ?? "",
    [CATEGORY_SUBTITLE_METADATA_KEY]: asTrimmedString(input.subtitle) ?? "",
    [CATEGORY_COVER_IMAGE_METADATA_KEY]:
      asTrimmedString(input.cover_image_url) ?? "",
    [CATEGORY_MOBILE_COVER_IMAGE_METADATA_KEY]:
      asTrimmedString(input.mobile_cover_image_url) ?? "",
    [CATEGORY_DISPLAY_ORDER_METADATA_KEY]: asNumber(input.display_order, 0),
    [CATEGORY_FEATURED_METADATA_KEY]: Boolean(input.featured_on_homepage),
  }
}
