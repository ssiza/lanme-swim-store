import { Text } from "@modules/common/components/ui"
import { SITE_COPY } from "@lib/constants/site"

const EmptyProducts = ({
  title = SITE_COPY.emptyCatalogTitle,
  description = SITE_COPY.emptyCatalogBody,
}: {
  title?: string
  description?: string
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ui-border-base bg-brand-mist/60 px-6 py-16 text-center"
      data-testid="empty-products"
    >
      <Text className="txt-large text-brand-ink">{title}</Text>
      <Text className="text-small-regular text-ui-fg-subtle">{description}</Text>
    </div>
  )
}

export default EmptyProducts
