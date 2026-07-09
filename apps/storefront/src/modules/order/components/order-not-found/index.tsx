import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading, Text } from "@modules/common/components/ui"

type OrderNotFoundProps = {
  orderId?: string
}

const OrderNotFound = ({ orderId }: OrderNotFoundProps) => {
  return (
    <div className="content-container max-w-xl py-16">
      <Heading level="h1" className="text-3xl-semi mb-3">
        Order not found
      </Heading>
      <Text className="text-ui-fg-subtle mb-4">
        We could not find an order matching this link
        {orderId ? ` (${orderId})` : ""}. Double-check the link from your
        confirmation email, or contact us for help.
      </Text>
      <LocalizedClientLink
        href="/customer-service"
        className="inline-flex items-center justify-center rounded-rounded bg-ui-fg-base text-ui-fg-on-color px-5 py-2.5 text-small-regular font-medium"
      >
        Contact customer service
      </LocalizedClientLink>
    </div>
  )
}

export default OrderNotFound
