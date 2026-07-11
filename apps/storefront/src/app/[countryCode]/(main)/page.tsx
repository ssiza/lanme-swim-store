import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import EmptyProducts from "@modules/store/components/empty-products"
import { SITE_COPY, SITE_DESCRIPTION, SITE_NAME } from "@lib/constants/site"
import { getDefaultCountryCode } from "@lib/constants/region"
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

  const region = await getRegion(countryCode)

  const { collections: allCollections } = await listCollections(
    { fields: "id, handle, title" },
    route
  )

  const homepageSettings = await getHomepageSettings()

  const collections = region
    ? await filterCollectionsWithProducts(allCollections ?? [], countryCode)
    : []

  logPageRender(route, {
    step: "home_data_ready",
    hasRegion: Boolean(region),
    collectionCount: collections.length,
    totalCollections: allCollections?.length ?? 0,
  })

  const collectionsHref = "/collections"

  if (!region) {
    return (
      <>
        <Hero
          collectionsHref={collectionsHref}
          backgroundImageUrl={homepageSettings.hero_background_image_url}
        />
        <div className="content-container py-12">
          <EmptyProducts
            title="Welcome to Lanmè Swim"
            description={`We could not load products for this region. Try /${getDefaultCountryCode()}/store to continue shopping.`}
          />
        </div>
      </>
    )
  }

  if (!collections.length) {
    return (
      <>
        <Hero
          collectionsHref={collectionsHref}
          backgroundImageUrl={homepageSettings.hero_background_image_url}
        />
        <div className="content-container py-12">
          <EmptyProducts
            title={SITE_COPY.emptyCatalogTitle}
            description="Browse all swimwear while collections are being set up."
          />
        </div>
      </>
    )
  }

  return (
    <>
      <Hero
        collectionsHref={collectionsHref}
        backgroundImageUrl={homepageSettings.hero_background_image_url}
      />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts
            collections={collections}
            region={region}
            countryCode={countryCode}
          />
        </ul>
      </div>
    </>
  )
}
