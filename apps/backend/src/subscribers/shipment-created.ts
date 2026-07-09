import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { handleOrderLifecycleEmail } from "../lib/order-email-subscriber"

export default async function shipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{
  id: string
  no_notification?: boolean
}>) {
  await handleOrderLifecycleEmail({
    eventName: "shipment.created",
    template: "order-shipped",
    container,
    no_notification: data.no_notification,
    fulfillment_id: data.id,
  })
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
