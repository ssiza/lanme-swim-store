import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { linkProductsToSalesChannelWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Sales channel IDs exposed to the storefront via publishable API keys.
 * Falls back to the store default sales channel when no key links exist.
 */
export async function getStorefrontSalesChannelIds(
  container: MedusaContainer
): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const storeModule = container.resolve(Modules.STORE)

  const ids = new Set<string>()

  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "sales_channels.id"],
    filters: {
      type: "publishable",
    },
  })

  for (const apiKey of apiKeys ?? []) {
    for (const salesChannel of apiKey.sales_channels ?? []) {
      if (salesChannel?.id) {
        ids.add(salesChannel.id)
      }
    }
  }

  if (ids.size > 0) {
    return [...ids]
  }

  const [store] = await storeModule.listStores(
    {},
    { select: ["default_sales_channel_id"] }
  )

  if (store?.default_sales_channel_id) {
    ids.add(store.default_sales_channel_id)
  }

  return [...ids]
}

export async function linkProductToStorefrontSalesChannels(
  container: MedusaContainer,
  productId: string
): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const salesChannelIds = await getStorefrontSalesChannelIds(container)

  if (!salesChannelIds.length) {
    logger.warn(
      JSON.stringify({
        event: "storefront.sales_channel_link",
        productId,
        reason: "no_storefront_sales_channels",
      })
    )
    return
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "sales_channels.id"],
    filters: { id: productId },
  })

  const product = products?.[0]
  if (!product) {
    return
  }

  const linkedIds = new Set(
    (product.sales_channels ?? [])
      .map((channel) => channel?.id)
      .filter((id): id is string => Boolean(id))
  )

  for (const salesChannelId of salesChannelIds) {
    if (linkedIds.has(salesChannelId)) {
      continue
    }

    await linkProductsToSalesChannelWorkflow(container).run({
      input: {
        id: salesChannelId,
        add: [productId],
      },
    })

    logger.info(
      JSON.stringify({
        event: "storefront.sales_channel_link",
        productId,
        salesChannelId,
        reason: "auto_linked",
      })
    )
  }
}

export async function linkAllPublishedProductsToStorefrontSalesChannels(
  container: MedusaContainer
): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const salesChannelIds = await getStorefrontSalesChannelIds(container)

  if (!salesChannelIds.length) {
    logger.warn("No storefront sales channels found; skipping product backfill")
    return
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "sales_channels.id"],
    filters: {
      status: "published",
    },
  })

  for (const salesChannelId of salesChannelIds) {
    const productIds = (products ?? [])
      .filter(
        (product) =>
          !(product.sales_channels ?? []).some(
            (channel) => channel?.id === salesChannelId
          )
      )
      .map((product) => product.id)

    if (!productIds.length) {
      continue
    }

    await linkProductsToSalesChannelWorkflow(container).run({
      input: {
        id: salesChannelId,
        add: productIds,
      },
    })

    logger.info(
      `Linked ${productIds.length} published product(s) to sales channel ${salesChannelId}`
    )
  }
}
