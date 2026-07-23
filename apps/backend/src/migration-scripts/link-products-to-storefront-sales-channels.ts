import { Lanme SwimContainer } from "@medusajs/framework"
import { linkAllPublishedProductsToStorefrontSalesChannels } from "../lib/storefront-sales-channels"

/**
 * Backfill: assign published products to every sales channel linked to a
 * publishable API key (or the store default sales channel).
 */
export default async function linkProductsToStorefrontSalesChannels({
  container,
}: {
  container: Lanme SwimContainer
}) {
  await linkAllPublishedProductsToStorefrontSalesChannels(container)
}
