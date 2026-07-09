export const HERO_BACKGROUND_IMAGE_METADATA_KEY = "hero_background_image_url"

export type HomepageSettings = {
  hero_background_image_url: string | null
}

export const getHeroBackgroundImageUrl = (
  metadata: Record<string, unknown> | null | undefined
): string | null => {
  const value = metadata?.[HERO_BACKGROUND_IMAGE_METADATA_KEY]

  if (typeof value !== "string" || !value.trim()) {
    return null
  }

  return value
}
