import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import { revalidateStorefrontCache } from "../lib/storefront-revalidate"

/**
 * Bust storefront homepage/footer cache when store settings change
 * (hero, footer about/address/links, etc.).
 */
export default async function storeHomepageRevalidateHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  await revalidateStorefrontCache(container, {
    event: event.name,
  })
}

export const config: SubscriberConfig = {
  event: ["store.updated", "store.created"],
}
