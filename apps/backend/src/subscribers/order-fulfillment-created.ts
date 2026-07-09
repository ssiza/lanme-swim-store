import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { handleOrderLifecycleEmail } from "../lib/order-email-subscriber"

export default async function orderFulfillmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{
  order_id: string
  fulfillment_id: string
  no_notification?: boolean
}>) {
  await handleOrderLifecycleEmail({
    eventName: "order.fulfillment_created",
    template: "order-fulfillment-preparing",
    container,
    no_notification: data.no_notification,
    order_id: data.order_id,
    fulfillment_id: data.fulfillment_id,
  })
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
}
