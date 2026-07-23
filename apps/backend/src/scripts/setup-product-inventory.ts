import type { Lanme SwimContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createProductOptionsWorkflow,
  createProductVariantsWorkflow,
  deleteProductVariantsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  buildPlannedSetupVariants,
  getInventoryPreset,
  getVariantOptionKey,
} from "../lib/inventory-presets"
import { resolveStockLocation } from "../lib/inventory-generation-runner"
import {
  ensureReusableInventoryItems,
  linkVariantToInventoryItem,
  type ReusableInventorySummary,
} from "../lib/reusable-inventory"
import {
  getExecFlagValue,
  isDryRun,
  isForce,
} from "../lib/script-args"
import {
  buildSetupProductInventoryPlan,
  logSetupProductInventoryPlan,
  type SetupProductInventoryPlan,
} from "../lib/setup-product-inventory-planning"
import {
  isDefaultVariant,
  type ProductWithVariantsRecord,
} from "../lib/product-variant-presets"

type ScriptInput = {
  container: Lanme SwimContainer
  args: string[]
}

const PRODUCT_FIELDS = [
  "id",
  "title",
  "handle",
  "status",
  "options.id",
  "options.title",
  "options.values.id",
  "options.values.value",
  "variants.id",
  "variants.title",
  "variants.sku",
  "variants.manage_inventory",
  "variants.options.value",
  "variants.options.option.title",
  "variants.prices.amount",
  "variants.prices.currency_code",
  "variants.inventory_items.inventory_item_id",
  "variants.inventory_items.inventory.id",
  "variants.inventory_items.inventory.sku",
  "variants.inventory_items.inventory.location_levels.id",
  "variants.inventory_items.inventory.location_levels.location_id",
  "variants.inventory_items.inventory.location_levels.stocked_quantity",
]

const loadProductByHandle = async (
  container: Lanme SwimContainer,
  handle: string
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product",
    fields: PRODUCT_FIELDS,
    filters: {
      handle,
    },
  })

  return ((data ?? [])[0] as ProductWithVariantsRecord | undefined) ?? null
}

const reloadProductByHandle = async (
  container: Lanme SwimContainer,
  handle: string
) => {
  const product = await loadProductByHandle(container, handle)

  if (!product?.id) {
    throw new Error(`Product "${handle}" could not be reloaded after updates.`)
  }

  return product
}

const ensurePresetOptions = async (
  container: Lanme SwimContainer,
  product: ProductWithVariantsRecord,
  plan: SetupProductInventoryPlan
) => {
  if (!product.id) {
    throw new Error("Missing product id while creating preset options.")
  }

  if (plan.defaultOnly) {
    await updateProductsWorkflow(container).run({
      input: {
        products: [
          {
            id: product.id,
            options: plan.preset.dimensions.map((dimension) => ({
              title: dimension.optionTitle,
              values: dimension.values,
            })),
          },
        ],
      },
    })

    return
  }

  for (const dimension of plan.preset.dimensions) {
    const existingOption = (product.options ?? []).find(
      (option) => option.title === dimension.optionTitle
    )

    if (existingOption?.id) {
      continue
    }

    await createProductOptionsWorkflow(container).run({
      input: {
        product_options: [
          {
            product_id: product.id,
            title: dimension.optionTitle,
            values: dimension.values,
          },
        ],
      },
    })
  }
}

const applySetupProductInventoryPlan = async (
  container: Lanme SwimContainer,
  product: ProductWithVariantsRecord,
  plan: SetupProductInventoryPlan
) => {
  if (!product.id) {
    throw new Error("Missing product id.")
  }

  if (plan.variantIdsToDelete.length > 0) {
    await deleteProductVariantsWorkflow(container).run({
      input: {
        ids: plan.variantIdsToDelete,
      },
    })
  }

  await ensurePresetOptions(container, product, plan)

  if (plan.variantsToCreate.length === 0) {
    return
  }

  await createProductVariantsWorkflow(container).run({
    input: {
      product_variants: plan.variantsToCreate.map((variant) => ({
        product_id: product.id!,
        title: variant.title,
        sku: variant.variantSku,
        manage_inventory: true,
        options: variant.options,
        prices: plan.pricesToCopy,
      })),
    },
  })
}

const extractVariantOptions = (variant: {
  options?: Array<{
    value?: string | null
    option?: { title?: string | null } | null
  }> | null
}) => {
  const options: Record<string, string> = {}

  for (const option of variant.options ?? []) {
    const title = option.option?.title
    const value = option.value

    if (title && value) {
      options[title] = value
    }
  }

  return options
}

const linkProductToReusableInventory = async ({
  container,
  product,
  plan,
  locationId,
  dryRun,
  summary,
}: {
  container: Lanme SwimContainer
  product: ProductWithVariantsRecord
  plan: SetupProductInventoryPlan
  locationId: string
  dryRun: boolean
  summary: ReusableInventorySummary
}) => {
  const handle = product.handle ?? "product"
  const allPlanned = buildPlannedSetupVariants(handle, plan.preset)
  const plannedByKey = new Map(
    allPlanned.map((variant) => [variant.key, variant])
  )
  const inventorySpecs = allPlanned.map((variant) => variant.inventory)
  const inventoryBySku = await ensureReusableInventoryItems({
    container,
    specs: inventorySpecs,
    locationId,
    defaultStockQuantity: plan.preset.defaultStockQuantity,
    dryRun,
    summary,
  })

  for (const variant of product.variants ?? []) {
    if (!variant.id || isDefaultVariant(variant)) {
      continue
    }

    const options = extractVariantOptions(variant)
    const planned = plannedByKey.get(getVariantOptionKey(options))

    if (!planned) {
      continue
    }

    const linkedInventorySku =
      variant.inventory_items?.[0]?.inventory?.sku?.trim() ?? ""

    if (linkedInventorySku === planned.inventory.sku) {
      summary.skipped += 1
      continue
    }

    if (linkedInventorySku) {
      console.log(
        `${dryRun ? "[dry-run]" : "[apply]"} skip relink for variant ${variant.id}: already linked to ${linkedInventorySku}, expected reusable ${planned.inventory.sku}`
      )
      summary.skipped += 1
      continue
    }

    const inventoryItem = inventoryBySku.get(planned.inventory.sku)
    const inventoryItemId = inventoryItem?.id

    if (!inventoryItemId && !dryRun) {
      throw new Error(
        `Missing reusable inventory item for SKU ${planned.inventory.sku}`
      )
    }

    await linkVariantToInventoryItem({
      container,
      variantId: variant.id,
      inventoryItemId: inventoryItemId ?? "dry-run",
      dryRun,
      summary,
    })
  }
}

export default async function setupProductInventory({
  container,
  args,
}: ScriptInput) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const dryRun = isDryRun(args)
  const force = isForce(args)
  const handle = getExecFlagValue(args, "handle")
  const presetName = getExecFlagValue(args, "preset")

  if (!handle || !presetName) {
    throw new Error(
      "Usage: npm run setup-product-inventory -- --handle <handle> --preset <preset> [--dry-run] [--force]"
    )
  }

  const preset = getInventoryPreset(presetName)
  const product = await loadProductByHandle(container, handle)

  if (!product?.id) {
    throw new Error(`Product not found for handle "${handle}".`)
  }

  const plan = buildSetupProductInventoryPlan({
    product,
    preset,
  })

  logger.info(
    dryRun
      ? "Starting reusable product inventory setup (dry run)"
      : "Starting reusable product inventory setup"
  )

  logSetupProductInventoryPlan(product, plan, dryRun)

  if (plan.skip) {
    return
  }

  if (!dryRun && plan.requiresForce && !force) {
    throw new Error(
      "Removing the default variant requires --force. Re-run with --dry-run to preview, then apply with --force."
    )
  }

  const stockLocation = await resolveStockLocation(container)

  if (!stockLocation?.id) {
    throw new Error("No stock location found.")
  }

  logger.info(
    `Using stock location: ${stockLocation.name} (${stockLocation.id})`
  )

  const summary: ReusableInventorySummary = {
    inventoryItemsCreated: 0,
    inventoryItemsReused: 0,
    stockLevelsCreated: 0,
    stockLevelsUpdated: 0,
    variantsLinked: 0,
    skipped: 0,
  }

  if (!dryRun) {
    await applySetupProductInventoryPlan(container, product, plan)
    const refreshed = await reloadProductByHandle(container, handle)

    await linkProductToReusableInventory({
      container,
      product: refreshed,
      plan,
      locationId: stockLocation.id,
      dryRun: false,
      summary,
    })
  } else {
    const inventorySpecs = buildPlannedSetupVariants(
      product.handle ?? handle,
      plan.preset
    ).map((variant) => variant.inventory)

    await ensureReusableInventoryItems({
      container,
      specs: inventorySpecs,
      locationId: stockLocation.id,
      defaultStockQuantity: plan.preset.defaultStockQuantity,
      dryRun: true,
      summary,
    })

    for (const variant of plan.variantsToCreate) {
      console.log(
        `[dry-run] link future variant ${variant.title} (${variant.variantSku}) -> reusable inventory ${variant.inventory.title} (${variant.inventory.sku})`
      )
      summary.variantsLinked += 1
    }

    await linkProductToReusableInventory({
      container,
      product,
      plan,
      locationId: stockLocation.id,
      dryRun: true,
      summary,
    })
  }

  logger.info("Reusable inventory setup summary:")
  logger.info(`  inventory items created: ${summary.inventoryItemsCreated}`)
  logger.info(`  inventory items reused: ${summary.inventoryItemsReused}`)
  logger.info(`  variants linked: ${summary.variantsLinked}`)
  logger.info(`  stock levels created: ${summary.stockLevelsCreated}`)
  logger.info(`  stock levels updated: ${summary.stockLevelsUpdated}`)
  logger.info(`  skipped: ${summary.skipped}`)
}
