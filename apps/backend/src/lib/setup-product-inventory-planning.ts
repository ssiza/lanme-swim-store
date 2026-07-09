import type { InventoryPreset, PlannedSetupVariant } from "./inventory-presets"
import {
  buildPlannedSetupVariants,
  getVariantOptionKey,
} from "./inventory-presets"
import {
  hasOnlyDefaultVariants,
  isDefaultVariant,
  type ProductWithVariantsRecord,
} from "./product-variant-presets"

export type VariantPriceInput = {
  amount: number
  currency_code: string
}

export type SetupProductInventoryPlan = {
  skip: boolean
  skipReason?: string
  preset: InventoryPreset
  defaultOnly: boolean
  currentVariantCount: number
  variantIdsToDelete: string[]
  variantsToCreate: PlannedSetupVariant[]
  variantsToLink: Array<{
    variantId: string
    inventorySku: string
    title: string
  }>
  pricesToCopy: VariantPriceInput[]
  requiresForce: boolean
}

const normalizePrices = (
  prices: Array<{ amount?: number | null; currency_code?: string | null }> | null | undefined
): VariantPriceInput[] =>
  (prices ?? [])
    .map((price) => ({
      amount: Number(price.amount ?? 0),
      currency_code: price.currency_code?.trim().toLowerCase() ?? "",
    }))
    .filter((price) => price.currency_code && price.amount >= 0)

const getExistingVariantKeys = (product: ProductWithVariantsRecord) => {
  const keys = new Set<string>()

  for (const variant of product.variants ?? []) {
    const options: Record<string, string> = {}

    for (const option of variant.options ?? []) {
      const title = option.option?.title
      const value = option.value

      if (title && value) {
        options[title] = value
      }
    }

    if (Object.keys(options).length > 0) {
      keys.add(getVariantOptionKey(options))
    }
  }

  return keys
}

const findVariantsToLink = (
  product: ProductWithVariantsRecord,
  plannedVariants: PlannedSetupVariant[]
) => {
  const plannedByKey = new Map(
    plannedVariants.map((variant) => [variant.key, variant])
  )
  const links: SetupProductInventoryPlan["variantsToLink"] = []

  for (const variant of product.variants ?? []) {
    if (!variant.id || isDefaultVariant(variant)) {
      continue
    }

    const options: Record<string, string> = {}

    for (const option of variant.options ?? []) {
      const title = option.option?.title
      const value = option.value

      if (title && value) {
        options[title] = value
      }
    }

    const key = getVariantOptionKey(options)
    const planned = plannedByKey.get(key)

    if (!planned) {
      continue
    }

    const linkedInventorySku =
      variant.inventory_items?.[0]?.inventory?.sku?.trim() ?? ""

    if (linkedInventorySku === planned.inventory.sku) {
      continue
    }

    links.push({
      variantId: variant.id,
      inventorySku: planned.inventory.sku,
      title: planned.title,
    })
  }

  return links
}

export const buildSetupProductInventoryPlan = ({
  product,
  preset,
}: {
  product: ProductWithVariantsRecord
  preset: InventoryPreset
}): SetupProductInventoryPlan => {
  const variants = product.variants ?? []
  const currentVariantCount = variants.length
  const defaultOnly = hasOnlyDefaultVariants(product)
  const defaultVariant = variants.find(isDefaultVariant) ?? variants[0]
  const pricesToCopy = normalizePrices(defaultVariant?.prices)
  const handle = product.handle ?? "product"
  const allPlanned = buildPlannedSetupVariants(handle, preset)
  const existingKeys = getExistingVariantKeys(product)

  const variantsToCreate = defaultOnly
    ? allPlanned
    : allPlanned.filter((variant) => !existingKeys.has(variant.key))

  const variantIdsToDelete = defaultOnly
    ? variants.filter(isDefaultVariant).map((variant) => variant.id!).filter(Boolean)
    : []

  const variantsToLink = defaultOnly ? [] : findVariantsToLink(product, allPlanned)

  if (
    !defaultOnly &&
    variantsToCreate.length === 0 &&
    variantsToLink.length === 0
  ) {
    return {
      skip: true,
      skipReason: "all preset variants already exist with reusable inventory links",
      preset,
      defaultOnly: false,
      currentVariantCount,
      variantIdsToDelete: [],
      variantsToCreate: [],
      variantsToLink: [],
      pricesToCopy,
      requiresForce: false,
    }
  }

  return {
    skip: false,
    preset,
    defaultOnly,
    currentVariantCount,
    variantIdsToDelete,
    variantsToCreate,
    variantsToLink,
    pricesToCopy,
    requiresForce: variantIdsToDelete.length > 0,
  }
}

export const logSetupProductInventoryPlan = (
  product: ProductWithVariantsRecord,
  plan: SetupProductInventoryPlan,
  dryRun: boolean
) => {
  const prefix = dryRun ? "[dry-run]" : "[apply]"

  console.log(`${prefix} product found: ${product.title} (${product.handle})`)
  console.log(`${prefix} current variant count: ${plan.currentVariantCount}`)
  console.log(
    `${prefix} inventory preset selected: ${plan.preset.label} (${plan.preset.name})`
  )

  if (plan.skip) {
    console.log(`${prefix} skipped: ${plan.skipReason}`)
    return
  }

  if (plan.variantIdsToDelete.length > 0) {
    console.log(
      `${prefix} variants to delete: ${plan.variantIdsToDelete.join(", ")}${
        plan.requiresForce ? " (requires --force)" : ""
      }`
    )
  }

  console.log(
    `${prefix} prices copied from default variant: ${
      plan.pricesToCopy.length > 0
        ? plan.pricesToCopy
            .map((price) => `${price.currency_code.toUpperCase()} ${price.amount}`)
            .join(", ")
        : "none found"
    }`
  )

  for (const variant of plan.variantsToCreate) {
    console.log(
      `${prefix} create variant ${variant.title} (${variant.variantSku}) -> reusable inventory ${variant.inventory.title} (${variant.inventory.sku})`
    )
  }

  for (const link of plan.variantsToLink) {
    console.log(
      `${prefix} relink variant ${link.variantId} (${link.title}) -> reusable inventory ${link.inventorySku}`
    )
  }
}
