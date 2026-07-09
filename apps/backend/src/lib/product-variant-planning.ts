import type { ProductVariantPreset, PlannedPresetVariant } from "./product-variant-presets"
import {
  buildPlannedPresetVariants,
  getExistingPresetValues,
  hasOnlyDefaultVariants,
  hasRealVariants,
  isDefaultOption,
  isDefaultVariant,
  type ProductVariantPriceRecord,
  type ProductWithVariantsRecord,
} from "./product-variant-presets"

export type VariantPriceInput = {
  amount: number
  currency_code: string
}

export type ProductVariantPresetPlan = {
  skip: boolean
  skipReason?: string
  preset: ProductVariantPreset
  defaultOnly: boolean
  currentVariantCount: number
  variantIdsToDelete: string[]
  optionIdsToDelete: string[]
  variantsToCreate: PlannedPresetVariant[]
  pricesToCopy: VariantPriceInput[]
  requiresForce: boolean
}

const normalizePrices = (
  prices: ProductVariantPriceRecord[] | null | undefined
): VariantPriceInput[] =>
  (prices ?? [])
    .map((price) => ({
      amount: Number(price.amount ?? 0),
      currency_code: price.currency_code?.trim().toLowerCase() ?? "",
    }))
    .filter((price) => price.currency_code && price.amount >= 0)

export const buildProductVariantPresetPlan = ({
  product,
  preset,
  force,
}: {
  product: ProductWithVariantsRecord
  preset: ProductVariantPreset
  force: boolean
}): ProductVariantPresetPlan => {
  const variants = product.variants ?? []
  const currentVariantCount = variants.length
  const defaultOnly = hasOnlyDefaultVariants(product)
  const defaultVariant = variants.find(isDefaultVariant) ?? variants[0]
  const pricesToCopy = normalizePrices(defaultVariant?.prices)

  if (hasRealVariants(product) && !force) {
    return {
      skip: true,
      skipReason:
        "product already has real variants; pass --force to add missing preset variants",
      preset,
      defaultOnly: false,
      currentVariantCount,
      variantIdsToDelete: [],
      optionIdsToDelete: [],
      variantsToCreate: [],
      pricesToCopy,
      requiresForce: false,
    }
  }

  const allPlanned = buildPlannedPresetVariants(product, preset)
  const existingValues = getExistingPresetValues(product, preset.optionTitle)

  const variantsToCreate = defaultOnly
    ? allPlanned
    : allPlanned.filter(
        (variant) => !existingValues.has(variant.optionValue)
      )

  const variantIdsToDelete = defaultOnly
    ? variants.filter(isDefaultVariant).map((variant) => variant.id!).filter(Boolean)
    : []

  const optionIdsToDelete =
    defaultOnly && force
      ? (product.options ?? [])
          .filter(isDefaultOption)
          .map((option) => option.id!)
          .filter(Boolean)
      : []

  if (!defaultOnly && variantsToCreate.length === 0) {
    return {
      skip: true,
      skipReason: "all preset values already exist on this product",
      preset,
      defaultOnly: false,
      currentVariantCount,
      variantIdsToDelete: [],
      optionIdsToDelete: [],
      variantsToCreate: [],
      pricesToCopy,
      requiresForce: false,
    }
  }

  if (defaultOnly && variantsToCreate.length === 0) {
    return {
      skip: true,
      skipReason: "no variants planned for this preset",
      preset,
      defaultOnly: true,
      currentVariantCount,
      variantIdsToDelete,
      optionIdsToDelete,
      variantsToCreate,
      pricesToCopy,
      requiresForce: variantIdsToDelete.length > 0,
    }
  }

  return {
    skip: false,
    preset,
    defaultOnly,
    currentVariantCount,
    variantIdsToDelete,
    optionIdsToDelete,
    variantsToCreate,
    pricesToCopy,
    requiresForce: variantIdsToDelete.length > 0,
  }
}

export const logProductVariantPresetPlan = (
  product: ProductWithVariantsRecord,
  plan: ProductVariantPresetPlan,
  dryRun: boolean
) => {
  const prefix = dryRun ? "[dry-run]" : "[apply]"

  console.log(`${prefix} product found: ${product.title} (${product.handle})`)
  console.log(`${prefix} current variant count: ${plan.currentVariantCount}`)
  console.log(`${prefix} preset selected: ${plan.preset.label} (${plan.preset.name})`)

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

  if (plan.optionIdsToDelete.length > 0) {
    console.log(
      `${prefix} options to delete: ${plan.optionIdsToDelete.join(", ")}`
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
      `${prefix} create variant ${variant.title} (${variant.sku}) option ${variant.optionTitle}=${variant.optionValue}`
    )
  }
}
