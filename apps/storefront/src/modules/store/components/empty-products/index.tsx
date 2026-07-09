import { Text } from "@modules/common/components/ui"

const EmptyProducts = ({
  title = "No products yet",
  description = "Check back soon - new pieces are on the way.",
}: {
  title?: string
  description?: string
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ui-border-base bg-ui-bg-subtle px-6 py-16 text-center"
      data-testid="empty-products"
    >
      <Text className="txt-large text-ui-fg-base">{title}</Text>
      <Text className="text-small-regular text-ui-fg-subtle">{description}</Text>
    </div>
  )
}

export default EmptyProducts
