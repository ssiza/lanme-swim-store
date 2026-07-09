import LocalizedClientLink from "@modules/common/components/localized-client-link"
import EmptyProducts from "@modules/store/components/empty-products"
import { HttpTypes } from "@medusajs/types"

export default function CollectionsListTemplate({
  collections,
  hasRegion,
}: {
  collections: HttpTypes.StoreCollection[]
  countryCode: string
  hasRegion: boolean
}) {
  if (!hasRegion) {
    return (
      <div className="content-container py-12">
        <EmptyProducts
          title="Collections unavailable in this region"
          description="Choose a supported region from the menu to browse collections."
        />
      </div>
    )
  }

  return (
    <div className="content-container py-12">
      <div className="mb-10">
        <h1 className="text-2xl-semi">Collections</h1>
        <p className="text-ui-fg-subtle mt-2">
          Browse curated product groups.
        </p>
      </div>

      {!collections.length ? (
        <EmptyProducts
          title="No collections with products"
          description="Collections will appear here once products are assigned."
        />
      ) : (
        <ul className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <li key={collection.id}>
              <LocalizedClientLink
                href={`/collections/${collection.handle}`}
                className="block rounded-lg border border-ui-border-base p-6 hover:border-ui-fg-base transition-colors"
              >
                <span className="text-lg text-ui-fg-base">{collection.title}</span>
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
