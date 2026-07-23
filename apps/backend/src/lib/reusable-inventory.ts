import type { Lanme SwimContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createInventoryItemsWorkflow,
  createInventoryLevelsWorkflow,
  createLinksWorkflow,
  updateInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"
import type { ReusableInventorySpec } from "./inventory-presets"
import { getLocationLevel } from "./inventory-generation"

export type InventoryItemRecord = {
  id?: string
  sku?: string | null
  title?: string | null
  location_levels?: Array<{
    id?: string
    location_id?: string
    stocked_quantity?: number | null
  }> | null
}

export type ReusableInventorySummary = {
  inventoryItemsCreated: number
  inventoryItemsReused: number
  stockLevelsCreated: number
  stockLevelsUpdated: number
  variantsLinked: number
  skipped: number
}

const INVENTORY_ITEM_FIELDS = [
  "id",
  "sku",
  "title",
  "location_levels.id",
  "location_levels.location_id",
  "location_levels.stocked_quantity",
]

export const loadInventoryItemsBySkus = async (
  container: Lanme SwimContainer,
  skus: string[]
) => {
  if (skus.length === 0) {
    return new Map<string, InventoryItemRecord>()
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const uniqueSkus = [...new Set(skus)]
  const items = new Map<string, InventoryItemRecord>()

  for (const sku of uniqueSkus) {
    const { data } = await query.graph({
      entity: "inventory_item",
      fields: INVENTORY_ITEM_FIELDS,
      filters: {
        sku,
      },
    })

    const item = (data ?? [])[0] as InventoryItemRecord | undefined

    if (item?.id && item.sku) {
      items.set(item.sku, item)
    }
  }

  return items
}

export const ensureReusableInventoryItems = async ({
  container,
  specs,
  locationId,
  defaultStockQuantity,
  dryRun,
  summary,
}: {
  container: Lanme SwimContainer
  specs: ReusableInventorySpec[]
  locationId: string
  defaultStockQuantity: number
  dryRun: boolean
  summary: ReusableInventorySummary
}) => {
  const existingBySku = await loadInventoryItemsBySkus(
    container,
    specs.map((spec) => spec.sku)
  )
  const resolved = new Map<string, InventoryItemRecord>()

  for (const spec of specs) {
    const existing = existingBySku.get(spec.sku)

    if (existing?.id) {
      resolved.set(spec.sku, existing)
      summary.inventoryItemsReused += 1

      const level = getLocationLevel(existing, locationId)
      const stockedQuantity = Number(level?.stocked_quantity ?? 0)

      if (!level) {
        console.log(
          `${dryRun ? "[dry-run]" : "[apply]"} create stock level for reusable inventory ${spec.sku} @ ${defaultStockQuantity}`
        )

        if (!dryRun) {
          await createInventoryLevelsWorkflow(container).run({
            input: {
              inventory_levels: [
                {
                  inventory_item_id: existing.id,
                  location_id: locationId,
                  stocked_quantity: defaultStockQuantity,
                },
              ],
            },
          })
          summary.stockLevelsCreated += 1
        }
      } else if (stockedQuantity <= 0) {
        console.log(
          `${dryRun ? "[dry-run]" : "[apply]"} update stock level for reusable inventory ${spec.sku} -> ${defaultStockQuantity}`
        )

        if (!dryRun) {
          await updateInventoryLevelsWorkflow(container).run({
            input: {
              updates: [
                {
                  id: level.id,
                  inventory_item_id: existing.id,
                  location_id: locationId,
                  stocked_quantity: defaultStockQuantity,
                },
              ],
            },
          })
          summary.stockLevelsUpdated += 1
        }
      } else {
        console.log(
          `${dryRun ? "[dry-run]" : "[apply]"} reuse inventory ${spec.title} (${spec.sku}) with stocked quantity ${stockedQuantity}`
        )
        summary.skipped += 1
      }

      continue
    }

    console.log(
      `${dryRun ? "[dry-run]" : "[apply]"} create reusable inventory item ${spec.title} (${spec.sku})`
    )

    if (dryRun) {
      resolved.set(spec.sku, { sku: spec.sku, title: spec.title })
      summary.inventoryItemsCreated += 1
      continue
    }

    const { result } = await createInventoryItemsWorkflow(container).run({
      input: {
        items: [
          {
            sku: spec.sku,
            title: spec.title,
            origin_country: "us",
            requires_shipping: true,
          },
        ],
      },
    })

    const created = result[0]

    if (!created?.id) {
      throw new Error(`Failed to create reusable inventory item for ${spec.sku}`)
    }

    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: [
          {
            inventory_item_id: created.id,
            location_id: locationId,
            stocked_quantity: defaultStockQuantity,
          },
        ],
      },
    })

    resolved.set(spec.sku, {
      id: created.id,
      sku: spec.sku,
      title: spec.title,
    })
    summary.inventoryItemsCreated += 1
    summary.stockLevelsCreated += 1
  }

  return resolved
}

export const linkVariantToInventoryItem = async ({
  container,
  variantId,
  inventoryItemId,
  dryRun,
  summary,
}: {
  container: Lanme SwimContainer
  variantId: string
  inventoryItemId: string
  dryRun: boolean
  summary: ReusableInventorySummary
}) => {
  console.log(
    `${dryRun ? "[dry-run]" : "[apply]"} link variant ${variantId} -> inventory ${inventoryItemId}`
  )

  if (dryRun) {
    return
  }

  await createLinksWorkflow(container).run({
    input: [
      {
        [Modules.PRODUCT]: {
          variant_id: variantId,
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
