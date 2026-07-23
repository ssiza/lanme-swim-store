import type { Lanme SwimContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createProductOptionsWorkflow,
  createProductVariantsWorkflow,
  deleteProductVariantsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  runInventoryGenerationForProducts,
} from "../lib/inventory-generation-runner"
import {
  buildProductVariantPresetPlan,
  logProductVariantPresetPlan,
  type ProductVariantPresetPlan,
} from "../lib/product-variant-planning"
import {
  getProductVariantPreset,
  type ProductWithVariantsRecord,
} from "../lib/product-variant-presets"
import {
  getExecFlagValue,
  isDryRun,
  isForce,
} from "../lib/script-args"

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

const ensurePresetOption = async (
  container: Lanme SwimContainer,
  product: ProductWithVariantsRecord,
  plan: ProductVariantPresetPlan
) => {
  const existingOption = (product.options ?? []).find(
    (option) => option.title === plan.preset.optionTitle
  )

  if (existingOption?.id) {
    return
  }

  if (!product.id) {
    throw new Error("Missing product id while creating preset option.")
  }

  await createProductOptionsWorkflow(container).run({
    input: {
      product_options: [
        {
          product_id: product.id,
          title: plan.preset.optionTitle,
          values: plan.preset.values,
        },
      ],
    },
  })
}

const applyProductVariantPresetPlan = async (
  container: Lanme SwimContainer,
  product: ProductWithVariantsRecord,
  plan: ProductVariantPresetPlan
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

  if (plan.defaultOnly) {
    await updateProductsWorkflow(container).run({
      input: {
        products: [
          {
            id: product.id,
            options: [
              {
                title: plan.preset.optionTitle,
                values: plan.preset.values,
              },
            ],
          },
        ],
      },
    })
  } else {
    await ensurePresetOption(container, product, plan)
  }

  if (plan.variantsToCreate.length === 0) {
    return
  }

  await createProductVariantsWorkflow(container).run({
    input: {
      product_variants: plan.variantsToCreate.map((variant) => ({
        product_id: product.id!,
        title: variant.title,
        sku: variant.sku,
        manage_inventory: true,
        options: {
          [variant.optionTitle]: variant.optionValue,
        },
        prices: plan.pricesToCopy,
      })),
    },
  })
}

export default async function generateProductVariants({
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
      "Usage: npm run generate-product-variants -- --handle <handle> --preset <preset> [--dry-run] [--force]"
    )
  }

  const preset = getProductVariantPreset(presetName)
  const product = await loadProductByHandle(container, handle)

  if (!product?.id) {
    throw new Error(`Product not found for handle "${handle}".`)
  }

  const plan = buildProductVariantPresetPlan({
    product,
    preset,
    force,
  })

  logger.info(
    dryRun
      ? "Starting product variant preset generation (dry run)"
      : "Starting product variant preset generation"
  )

  logProductVariantPresetPlan(product, plan, dryRun)

  if (plan.skip) {
    return
  }

  if (!dryRun && plan.requiresForce && !force) {
    throw new Error(
      "Removing the default variant requires --force. Re-run with --dry-run to preview, then apply with --force."
    )
  }

  if (!dryRun) {
    await applyProductVariantPresetPlan(container, product, plan)

    const refreshed = await reloadProductByHandle(container, handle)

    logger.info("Running inventory generation for updated product variants...")

    const inventorySummary = await runInventoryGenerationForProducts({
      container,
      products: [refreshed],
      dryRun: false,
      defaultStockQuantity: preset.defaultStockQuantity,
    })

    logger.info("Inventory generation summary:")
    logger.info(`  products scanned: ${inventorySummary.productsScanned}`)
    logger.info(`  variants scanned: ${inventorySummary.variantsScanned}`)
    logger.info(
      `  inventory items created: ${inventorySummary.inventoryItemsCreated}`
    )
    logger.info(`  variants linked: ${inventorySummary.variantsLinked}`)
    logger.info(
      `  stock levels created: ${inventorySummary.stockLevelsCreated}`
    )
    logger.info(
      `  stock levels updated: ${inventorySummary.stockLevelsUpdated}`
    )
    logger.info(
      `  variant skus updated: ${inventorySummary.variantsSkuUpdated}`
    )
    logger.info(
      `  manage_inventory enabled: ${inventorySummary.manageInventoryEnabled}`
    )
    logger.info(`  skipped: ${inventorySummary.skipped}`)
  } else {
    logger.info(
      "Inventory would be generated for new variants after creation (run without --dry-run to apply)."
    )
  }
}
