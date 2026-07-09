import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createInventoryItemsWorkflow,
  createInventoryLevelsWorkflow,
  createLinksWorkflow,
  updateInventoryLevelsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  DEFAULT_STOCK_QUANTITY,
  PREFERRED_SALES_CHANNEL_NAME,
  planVariantInventory,
  type ProductRecord,
  type VariantInventoryPlan,
} from "./inventory-generation"

export type InventoryRunSummary = {
  productsScanned: number
  variantsScanned: number
  inventoryItemsCreated: number
  variantsLinked: number
  stockLevelsCreated: number
  stockLevelsUpdated: number
  variantsSkuUpdated: number
  manageInventoryEnabled: number
  skipped: number
}

const STOCK_LOCATION_FIELDS = [
  "id",
  "name",
  "sales_channels.id",
  "sales_channels.name",
]

export const resolveStockLocation = async (container: MedusaContainer) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: STOCK_LOCATION_FIELDS,
  })

  const locations = (stockLocations ?? []) as Array<{
    id?: string
    name?: string | null
    sales_channels?: Array<{ id?: string; name?: string | null }> | null
  }>

  const preferred = locations.find((location) =>
    location.sales_channels?.some(
      (channel) => channel.name === PREFERRED_SALES_CHANNEL_NAME
    )
  )

  if (preferred?.id) {
    return {
      id: preferred.id,
      name: preferred.name ?? preferred.id,
      reason: `connected to ${PREFERRED_SALES_CHANNEL_NAME}`,
    }
  }

  const fallback = locations.find((location) => location.id)

  if (!fallback?.id) {
    return null
  }

  return {
    id: fallback.id,
    name: fallback.name ?? fallback.id,
    reason: "first available stock location",
  }
}

export const logInventoryPlan = (
  plan: VariantInventoryPlan,
  dryRun: boolean
) => {
  const prefix = dryRun ? "[dry-run]" : "[apply]"

  if (plan.skip) {
    console.log(
      `${prefix} skip variant ${plan.variantId} (${plan.sku}) - ${plan.skipReason}`
    )
    return
  }

  const actions: string[] = []

  if (plan.createInventoryItem) {
    actions.push(`create inventory item (${plan.sku})`)
  }

  if (plan.linkVariant) {
    actions.push("link inventory item to variant")
  }

  if (plan.createStockLevel) {
    actions.push(`create stock level @ ${plan.targetStockQuantity}`)
  }

  if (plan.updateStockLevel) {
    actions.push(`update stock level -> ${plan.targetStockQuantity}`)
  }

  if (plan.updateVariantSku) {
    actions.push(`set variant sku -> ${plan.sku}`)
  }

  if (plan.setManageInventory) {
    actions.push("enable manage_inventory")
  }

  console.log(
    `${prefix} variant ${plan.variantId} (${plan.productTitle}) ${actions.join(", ")}`
  )
}

const applyInventoryPlan = async (
  container: MedusaContainer,
  plan: VariantInventoryPlan,
  locationId: string,
  summary: InventoryRunSummary
) => {
  let inventoryItemId = plan.existingInventoryItemId

  if (plan.createInventoryItem) {
    const { result } = await createInventoryItemsWorkflow(container).run({
      input: {
        items: [
          {
            sku: plan.sku,
            title: plan.inventoryTitle,
            origin_country: "us",
            requires_shipping: true,
          },
        ],
      },
    })

    inventoryItemId = result[0]?.id
    summary.inventoryItemsCreated += 1
  }

  if (!inventoryItemId) {
    throw new Error(`Missing inventory item for variant ${plan.variantId}`)
  }

  if (plan.linkVariant) {
    await createLinksWorkflow(container).run({
      input: [
        {
          [Modules.PRODUCT]: {
            variant_id: plan.variantId,
          },
          [Modules.INVENTORY]: {
            inventory_item_id: inventoryItemId,
          },
          data: {
            required_quantity: 1,
          },
        },
      ],
    })

    summary.variantsLinked += 1
  }

  if (plan.createStockLevel) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: [
          {
            inventory_item_id: inventoryItemId,
            location_id: locationId,
            stocked_quantity: plan.targetStockQuantity,
          },
        ],
      },
    })

    summary.stockLevelsCreated += 1
  }

  if (plan.updateStockLevel) {
    await updateInventoryLevelsWorkflow(container).run({
      input: {
        updates: [
          {
            id: plan.existingInventoryLevelId,
            inventory_item_id: inventoryItemId,
            location_id: locationId,
            stocked_quantity: plan.targetStockQuantity,
          },
        ],
      },
    })

    summary.stockLevelsUpdated += 1
  }

  if (plan.updateVariantSku || plan.setManageInventory) {
    await updateProductVariantsWorkflow(container).run({
      input: {
        product_variants: [
          {
            id: plan.variantId,
            ...(plan.updateVariantSku ? { sku: plan.sku } : {}),
            ...(plan.setManageInventory ? { manage_inventory: true } : {}),
          },
        ],
      },
    })

    if (plan.updateVariantSku) {
      summary.variantsSkuUpdated += 1
    }

    if (plan.setManageInventory) {
      summary.manageInventoryEnabled += 1
    }
  }
}

export const runInventoryGenerationForProducts = async ({
  container,
  products,
  dryRun,
  defaultStockQuantity = DEFAULT_STOCK_QUANTITY,
}: {
  container: MedusaContainer
  products: ProductRecord[]
  dryRun: boolean
  defaultStockQuantity?: number
}) => {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const stockLocation = await resolveStockLocation(container)

  if (!stockLocation) {
    throw new Error("No stock location found. Create a stock location first.")
  }

  logger.info(
    `Using stock location ${stockLocation.name} (${stockLocation.id}) - ${stockLocation.reason}`
  )

  const summary: InventoryRunSummary = {
    productsScanned: products.length,
    variantsScanned: 0,
    inventoryItemsCreated: 0,
    variantsLinked: 0,
    stockLevelsCreated: 0,
    stockLevelsUpdated: 0,
    variantsSkuUpdated: 0,
    manageInventoryEnabled: 0,
    skipped: 0,
  }

  for (const product of products) {
    for (const variant of product.variants ?? []) {
      summary.variantsScanned += 1

      const plan = planVariantInventory({
        product,
        variant,
        locationId: stockLocation.id,
        defaultStockQuantity,
      })

      if (!plan) {
        summary.skipped += 1
        logger.warn(`Skipping variant without id on product ${product.id}`)
        continue
      }

      logInventoryPlan(plan, dryRun)

      if (plan.skip) {
        summary.skipped += 1
        continue
      }

      if (!dryRun) {
        await applyInventoryPlan(
          container,
          plan,
          stockLocation.id,
          summary
        )
      }
    }
  }

  return summary
}
