import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DEFAULT_STOCK_QUANTITY, type ProductRecord } from "../lib/inventory-generation"
import { runInventoryGenerationForProducts } from "../lib/inventory-generation-runner"
import { isDryRun } from "../lib/script-args"

type ScriptInput = {
  container: MedusaContainer
  args: string[]
}

const PRODUCT_FIELDS = [
  "id",
  "title",
  "handle",
  "status",
  "variants.id",
  "variants.title",
  "variants.sku",
  "variants.manage_inventory",
  "variants.options.value",
  "variants.options.option.title",
  "variants.inventory_items.inventory_item_id",
  "variants.inventory_items.inventory.id",
  "variants.inventory_items.inventory.sku",
  "variants.inventory_items.inventory.location_levels.id",
  "variants.inventory_items.inventory.location_levels.location_id",
  "variants.inventory_items.inventory.location_levels.stocked_quantity",
]

const listAllProducts = async (container: MedusaContainer) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const products: ProductRecord[] = []
  const take = 50
  let skip = 0

  while (true) {
    const { data, metadata } = await query.graph({
      entity: "product",
      fields: PRODUCT_FIELDS,
      pagination: {
        skip,
        take,
      },
    })

    products.push(...((data ?? []) as ProductRecord[]))

    const count = metadata?.count ?? products.length

    if (products.length >= count || (data?.length ?? 0) < take) {
      break
    }

    skip += take
  }

  return products
}

export default async function generateInventory({
  container,
  args,
}: ScriptInput) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const dryRun = isDryRun(args)

  logger.info(
    dryRun
      ? "Starting inventory generation (dry run)"
      : "Starting inventory generation"
  )

  const products = await listAllProducts(container)
  const summary = await runInventoryGenerationForProducts({
    container,
    products,
    dryRun,
    defaultStockQuantity: DEFAULT_STOCK_QUANTITY,
  })

  logger.info("Inventory generation summary:")
  logger.info(`  products scanned: ${summary.productsScanned}`)
  logger.info(`  variants scanned: ${summary.variantsScanned}`)
  logger.info(`  inventory items created: ${summary.inventoryItemsCreated}`)
  logger.info(`  variants linked: ${summary.variantsLinked}`)
  logger.info(`  stock levels created: ${summary.stockLevelsCreated}`)
  logger.info(`  stock levels updated: ${summary.stockLevelsUpdated}`)
  logger.info(`  variant skus updated: ${summary.variantsSkuUpdated}`)
  logger.info(`  manage_inventory enabled: ${summary.manageInventoryEnabled}`)
  logger.info(`  skipped: ${summary.skipped}`)
}
