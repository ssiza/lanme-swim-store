export const COLLECTION_COVER_IMAGE_METADATA_KEY = "homepage_cover_image_url"
export const COLLECTION_MOBILE_IMAGE_METADATA_KEY =
  "homepage_mobile_image_url"
export const COLLECTION_PROMO_HEADLINE_METADATA_KEY = "homepage_promo_headline"
export const COLLECTION_DESCRIPTION_METADATA_KEY = "homepage_description"
export const COLLECTION_CTA_LABEL_METADATA_KEY = "homepage_cta_label"
export const COLLECTION_CTA_HREF_METADATA_KEY = "homepage_cta_href"
export const COLLECTION_DISPLAY_ORDER_METADATA_KEY = "homepage_display_order"
export const COLLECTION_FEATURED_METADATA_KEY = "homepage_featured"
export const COLLECTION_SHOW_PRODUCTS_METADATA_KEY = "homepage_show_products"

export type CollectionHomepageSettings = {
  cover_image_url: string | null
  mobile_image_url: string | null
  promo_headline: string | null
  description: string | null
  cta_label: string | null
  cta_href: string | null
  display_order: number
  featured_on_homepage: boolean
  show_products_on_homepage: boolean
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

const asBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true
    }
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false
    }
  }

  if (typeof value === "number") {
    return value === 1
  }

  return fallback
}

export const getCollectionHomepageSettings = (
  metadata: Record<string, unknown> | null | undefined
): CollectionHomepageSettings => {
  const featured = asBoolean(metadata?.[COLLECTION_FEATURED_METADATA_KEY], false)
  const hasShowProductsKey =
    metadata?.[COLLECTION_SHOW_PRODUCTS_METADATA_KEY] !== undefined &&
    metadata?.[COLLECTION_SHOW_PRODUCTS_METADATA_KEY] !== null &&
    metadata?.[COLLECTION_SHOW_PRODUCTS_METADATA_KEY] !== ""

  return {
    cover_image_url: asTrimmedString(
      metadata?.[COLLECTION_COVER_IMAGE_METADATA_KEY]
    ),
    mobile_image_url: asTrimmedString(
      metadata?.[COLLECTION_MOBILE_IMAGE_METADATA_KEY]
    ),
    promo_headline: asTrimmedString(
      metadata?.[COLLECTION_PROMO_HEADLINE_METADATA_KEY]
    ),
    description: asTrimmedString(
      metadata?.[COLLECTION_DESCRIPTION_METADATA_KEY]
    ),
    cta_label: asTrimmedString(metadata?.[COLLECTION_CTA_LABEL_METADATA_KEY]),
    cta_href: asTrimmedString(metadata?.[COLLECTION_CTA_HREF_METADATA_KEY]),
    display_order: asNumber(
      metadata?.[COLLECTION_DISPLAY_ORDER_METADATA_KEY],
      0
    ),
    featured_on_homepage: featured,
    // Default to showing product rails unless explicitly disabled.
    show_products_on_homepage: hasShowProductsKey
      ? asBoolean(metadata?.[COLLECTION_SHOW_PRODUCTS_METADATA_KEY], true)
      : true,
  }
}

export const toCollectionHomepageMetadata = (input: {
  cover_image_url?: string | null
  mobile_image_url?: string | null
  promo_headline?: string | null
  description?: string | null
  cta_label?: string | null
  cta_href?: string | null
  display_order?: number | string | null
  featured_on_homepage?: boolean
  show_products_on_homepage?: boolean
}): Record<string, string | number | boolean> => {
  return {
    [COLLECTION_COVER_IMAGE_METADATA_KEY]:
      asTrimmedString(input.cover_image_url) ?? "",
    [COLLECTION_MOBILE_IMAGE_METADATA_KEY]:
      asTrimmedString(input.mobile_image_url) ?? "",
    [COLLECTION_PROMO_HEADLINE_METADATA_KEY]:
      asTrimmedString(input.promo_headline) ?? "",
    [COLLECTION_DESCRIPTION_METADATA_KEY]:
      asTrimmedString(input.description) ?? "",
    [COLLECTION_CTA_LABEL_METADATA_KEY]:
      asTrimmedString(input.cta_label) ?? "",
    [COLLECTION_CTA_HREF_METADATA_KEY]: asTrimmedString(input.cta_href) ?? "",
    [COLLECTION_DISPLAY_ORDER_METADATA_KEY]: asNumber(input.display_order, 0),
    [COLLECTION_FEATURED_METADATA_KEY]: Boolean(input.featured_on_homepage),
    [COLLECTION_SHOW_PRODUCTS_METADATA_KEY]: Boolean(
      input.show_products_on_homepage
    ),
  }
}
