/**
 * Resolve desktop/mobile CMS image pair with mutual fallback.
 * Upload either, both, or only one — the other viewport reuses it.
 */
export function resolveResponsiveImagePair(
  desktop?: string | null,
  mobile?: string | null
): { desktop: string; mobile: string } | null {
  const d = typeof desktop === "string" ? desktop.trim() : ""
  const m = typeof mobile === "string" ? mobile.trim() : ""

  if (!d && !m) {
    return null
  }

  return {
    desktop: d || m,
    mobile: m || d,
  }
}
