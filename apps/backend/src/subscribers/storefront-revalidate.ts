import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import {
  revalidateStorefrontCache,
  resolveProductHandle,
} from "../lib/storefront-revalidate"

export default async function storefrontRevalidateHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; product_id?: string }>) {
  const productId = event.data?.product_id ?? event.data?.id
  const productHandle = await resolveProductHandle(container, productId)

  await revalidateStorefrontCache(container, {
    productHandle,
    event: event.name,
  })
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
    "product.deleted",
    "product-category.created",
    "product-category.updated",
    "product-category.deleted",
    "product-collection.created",
    "product-collection.updated",
    "product-collection.deleted",
    "product-variant.created",
    "product-variant.updated",
    "product-variant.deleted",
  ],
}
