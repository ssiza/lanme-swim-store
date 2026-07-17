export const FOOTER_ABOUT_METADATA_KEY = "footer_about"
export const FOOTER_ADDRESS_METADATA_KEY = "footer_address"
export const FOOTER_LINKS_METADATA_KEY = "footer_links"
export const FOOTER_SUPPORT_LINKS_METADATA_KEY = "footer_support_links"
export const FOOTER_ABOUT_LINKS_METADATA_KEY = "footer_about_links"

/** Max characters for footer about text (admin + storefront). */
export const FOOTER_ABOUT_MAX_LENGTH = 280

export type FooterLink = {
  label: string
  href: string
}

export type FooterSettings = {
  about: string | null
  address: string | null
  links: FooterLink[]
  support_links: FooterLink[]
  about_links: FooterLink[]
  /** True when any footer_* metadata key has been saved at least once. */
  configured: boolean
}

const MAX_LINKS = 8

const FOOTER_KEYS = [
  FOOTER_ABOUT_METADATA_KEY,
  FOOTER_ADDRESS_METADATA_KEY,
  FOOTER_LINKS_METADATA_KEY,
  FOOTER_SUPPORT_LINKS_METADATA_KEY,
  FOOTER_ABOUT_LINKS_METADATA_KEY,
] as const

export const clampFooterAbout = (value: string): string =>
  value.trim().slice(0, FOOTER_ABOUT_MAX_LENGTH)

export const getFooterAbout = (
  metadata: Record<string, unknown> | null | undefined
): string | null => {
  const value = metadata?.[FOOTER_ABOUT_METADATA_KEY]

  if (typeof value !== "string") {
    return null
  }

  // Preserve intentional empty string from admin (do not treat as "unset").
  if (!value.trim()) {
    return metadata && FOOTER_ABOUT_METADATA_KEY in metadata ? "" : null
  }

  return clampFooterAbout(value) || null
}

export const getFooterAddress = (
  metadata: Record<string, unknown> | null | undefined
): string | null => {
  const value = metadata?.[FOOTER_ADDRESS_METADATA_KEY]

  if (typeof value !== "string") {
    return null
  }

  if (!value.trim()) {
    return metadata && FOOTER_ADDRESS_METADATA_KEY in metadata ? "" : null
  }

  return value.trim()
}

const parseFooterLinks = (value: unknown): FooterLink[] => {
  if (value == null || value === "") {
    return []
  }

  let parsed: unknown = value

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value)
    } catch {
      return []
    }
  }

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null
      }

      const label =
        typeof (item as { label?: unknown }).label === "string"
          ? (item as { label: string }).label.trim()
          : ""
      const href =
        typeof (item as { href?: unknown }).href === "string"
          ? (item as { href: string }).href.trim()
          : ""

      if (!label || !href) {
        return null
      }

      return { label, href }
    })
    .filter((link): link is FooterLink => Boolean(link))
    .slice(0, MAX_LINKS)
}

export const getFooterLinks = (
  metadata: Record<string, unknown> | null | undefined
): FooterLink[] => parseFooterLinks(metadata?.[FOOTER_LINKS_METADATA_KEY])

export const getFooterSupportLinks = (
  metadata: Record<string, unknown> | null | undefined
): FooterLink[] =>
  parseFooterLinks(metadata?.[FOOTER_SUPPORT_LINKS_METADATA_KEY])

export const getFooterAboutLinks = (
  metadata: Record<string, unknown> | null | undefined
): FooterLink[] =>
  parseFooterLinks(metadata?.[FOOTER_ABOUT_LINKS_METADATA_KEY])

export const isFooterConfigured = (
  metadata: Record<string, unknown> | null | undefined
): boolean => {
  if (!metadata) {
    return false
  }

  return FOOTER_KEYS.some((key) => key in metadata)
}

export const getFooterSettings = (
  metadata: Record<string, unknown> | null | undefined
): FooterSettings => ({
  about: getFooterAbout(metadata),
  address: getFooterAddress(metadata),
  links: getFooterLinks(metadata),
  support_links: getFooterSupportLinks(metadata),
  about_links: getFooterAboutLinks(metadata),
  configured: isFooterConfigured(metadata),
})

export const serializeFooterLinks = (links: FooterLink[]): string => {
  const cleaned = links
    .map((link) => ({
      label: link.label.trim(),
      href: link.href.trim(),
    }))
    .filter((link) => link.label && link.href)
    .slice(0, MAX_LINKS)

  return JSON.stringify(cleaned)
}

/** Shallow-merge store metadata so hero/footer saves cannot wipe each other. */
export const mergeStoreMetadata = (
  existing: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown>
): Record<string, unknown> => ({
  ...(existing && typeof existing === "object" ? existing : {}),
  ...patch,
})
