import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { linkProductToStorefrontSalesChannels } from "../lib/storefront-sales-channels"

export default async function productStorefrontSalesChannelHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await linkProductToStorefrontSalesChannels(container, data.id)
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
