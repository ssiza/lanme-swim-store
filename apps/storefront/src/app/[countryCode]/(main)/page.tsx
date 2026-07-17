import { Metadata } from "next"

import Homepage from "@modules/home/components/homepage"
import { SITE_DESCRIPTION, SITE_NAME } from "@lib/constants/site"
import { getHomepageSettings } from "@lib/data/homepage"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { filterCollectionsWithProducts } from "@lib/util/collection-utils"
import { logPageRender } from "@lib/util/storefront-fetch-log"

export const revalidate = 60

export const metadata: Metadata = {
  title: {
    absolute: SITE_NAME,
  },
  description: SITE_DESCRIPTION,
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params
  const route = `/${countryCode}`

  logPageRender(route, { step: "home_start" })

  // Homepage CMS is public (no publishable key). Region/products still need a
  // valid key — banners/hero must render even when catalog APIs fail.
  const [region, homepageSettings, collectionsResult] = await Promise.all([
    getRegion(countryCode),
    getHomepageSettings(),
    listCollections({ fields: "id, handle, title" }, route),
  ])

  const allCollections = collectionsResult.collections ?? []
  const collections = region
    ? await filterCollectionsWithProducts(allCollections, countryCode)
    : []

  logPageRender(route, {
    step: "home_data_ready",
    hasRegion: Boolean(region),
    collectionCount: collections.length,
    totalCollections: allCollections.length,
    heroSlides: homepageSettings.hero_slides.length,
    categoryBanners: homepageSettings.featured_categories.length,
    hasHeroImage: Boolean(
      homepageSettings.hero_slides[0]?.desktop_image_url ||
        homepageSettings.hero_slides[0]?.mobile_image_url ||
        homepageSettings.hero_background_image_url
    ),
  })

  return (
    <Homepage
      settings={homepageSettings}
      collections={collections}
      region={region}
      countryCode={countryCode}
    />
  )
}
