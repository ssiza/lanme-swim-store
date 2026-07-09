import { Metadata } from "next"

import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { filterCollectionsWithProducts } from "@lib/util/collection-utils"
import { logPageRender } from "@lib/util/storefront-fetch-log"
import CollectionsTemplate from "@modules/collections/templates/collections-list"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse products by collection.",
}

type Params = {
  params: Promise<{
    countryCode: string
  }>
}

export default async function CollectionsPage(props: Params) {
  const params = await props.params
  const { countryCode } = params
  const route = `/${countryCode}/collections`

  logPageRender(route, { step: "collections_index_start" })

  const region = await getRegion(countryCode)
  const { collections: allCollections } = await listCollections(
    { fields: "id, handle, title" },
    route
  )

  const collections = region
    ? await filterCollectionsWithProducts(allCollections ?? [], countryCode)
    : []

  logPageRender(route, {
    step: "collections_index_ready",
    hasRegion: Boolean(region),
    collectionCount: collections.length,
  })

  return (
    <CollectionsTemplate
      collections={collections}
      countryCode={countryCode}
      hasRegion={Boolean(region)}
    />
  )
}
