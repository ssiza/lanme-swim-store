export const FOOTER_ABOUT_METADATA_KEY = "footer_about"
export const FOOTER_ADDRESS_METADATA_KEY = "footer_address"
export const FOOTER_LINKS_METADATA_KEY = "footer_links"

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
}

const MAX_LINKS = 8

export const clampFooterAbout = (value: string): string =>
  value.trim().slice(0, FOOTER_ABOUT_MAX_LENGTH)

export const getFooterAbout = (
  metadata: Record<string, unknown> | null | undefined
): string | null => {
  const value = metadata?.[FOOTER_ABOUT_METADATA_KEY]

  if (typeof value !== "string" || !value.trim()) {
    return null
  }

  return clampFooterAbout(value) || null
}

export const getFooterAddress = (
  metadata: Record<string, unknown> | null | undefined
): string | null => {
  const value = metadata?.[FOOTER_ADDRESS_METADATA_KEY]

  if (typeof value !== "string" || !value.trim()) {
    return null
  }

  return value.trim()
}

export const getFooterLinks = (
  metadata: Record<string, unknown> | null | undefined
): FooterLink[] => {
  const value = metadata?.[FOOTER_LINKS_METADATA_KEY]

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

export const getFooterSettings = (
  metadata: Record<string, unknown> | null | undefined
): FooterSettings => ({
  about: getFooterAbout(metadata),
  address: getFooterAddress(metadata),
  links: getFooterLinks(metadata),
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
