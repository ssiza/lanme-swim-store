import {
  DEFAULT_STOCK_QUANTITY,
  getMeaningfulVariantOptions,
  slugToSkuPart,
  type VariantRecord,
} from "./inventory-generation"

export type ProductVariantPresetName =
  | "apparel-standard-sizes"
  | "apparel-basic-colors"
  | "one-size"
  | "shorts-sizes"

export type ProductVariantPreset = {
  name: ProductVariantPresetName
  label: string
  optionTitle: string
  values: string[]
  defaultStockQuantity: number
}

export const PRODUCT_VARIANT_PRESETS: Record<
  ProductVariantPresetName,
  ProductVariantPreset
> = {
  "apparel-standard-sizes": {
    name: "apparel-standard-sizes",
    label: "Apparel Standard Sizes",
    optionTitle: "Size",
    values: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
    defaultStockQuantity: DEFAULT_STOCK_QUANTITY,
  },
  "apparel-basic-colors": {
    name: "apparel-basic-colors",
    label: "Apparel Basic Colors",
    optionTitle: "Color",
    values: ["Black", "White", "Purple", "Gray", "Navy"],
    defaultStockQuantity: DEFAULT_STOCK_QUANTITY,
  },
  "one-size": {
    name: "one-size",
    label: "One Size",
    optionTitle: "Size",
    values: ["One Size"],
    defaultStockQuantity: DEFAULT_STOCK_QUANTITY,
  },
  "shorts-sizes": {
    name: "shorts-sizes",
    label: "Shorts Sizes",
    optionTitle: "Size",
    values: ["XS", "S", "M", "L", "XL", "2XL"],
    defaultStockQuantity: DEFAULT_STOCK_QUANTITY,
  },
}

export const PRODUCT_VARIANT_PRESET_NAMES = Object.keys(
  PRODUCT_VARIANT_PRESETS
) as ProductVariantPresetName[]

export const getProductVariantPreset = (name: string): ProductVariantPreset => {
  const preset = PRODUCT_VARIANT_PRESETS[name as ProductVariantPresetName]

  if (!preset) {
    throw new Error(
      `Unknown preset "${name}". Available: ${PRODUCT_VARIANT_PRESET_NAMES.join(", ")}`
    )
  }

  return preset
}

const DEFAULT_OPTION_TITLES = new Set(["default", "default option"])
const DEFAULT_VARIANT_TITLES = new Set(["default variant"])

export type ProductOptionRecord = {
  id?: string
  title?: string | null
  values?: Array<{ id?: string; value?: string | null }> | null
}

export type ProductVariantPriceRecord = {
  amount?: number | null
  currency_code?: string | null
}

export type ProductWithVariantsRecord = {
  id?: string
  title?: string | null
  handle?: string | null
  status?: string | null
  options?: ProductOptionRecord[] | null
  variants?: Array<
    VariantRecord & {
      prices?: ProductVariantPriceRecord[] | null
    }
  > | null
}

export const isDefaultOption = (option?: ProductOptionRecord | null) => {
  const title = option?.title?.trim().toLowerCase() ?? ""
  return !title || DEFAULT_OPTION_TITLES.has(title)
}

export const isDefaultVariant = (variant: VariantRecord) => {
  const title = variant.title?.trim().toLowerCase() ?? ""

  if (title && DEFAULT_VARIANT_TITLES.has(title)) {
    return true
  }

  return getMeaningfulVariantOptions(variant.options ?? []).length === 0
}

export const hasOnlyDefaultVariants = (product: ProductWithVariantsRecord) => {
  const variants = product.variants ?? []

  if (variants.length === 0) {
    return true
  }

  return variants.every(isDefaultVariant)
}

export const hasRealVariants = (product: ProductWithVariantsRecord) =>
  !hasOnlyDefaultVariants(product)

export const generatePresetVariantSku = (
  productHandle: string,
  optionValue: string
) => {
  const base = slugToSkuPart(productHandle || "PRODUCT")
  const valuePart = slugToSkuPart(optionValue)

  return valuePart ? `${base}-${valuePart}` : `${base}-DEFAULT`
}

export const generatePresetVariantTitle = (optionValue: string) => optionValue

export const generatePresetInventoryTitle = (
  productTitle: string,
  optionTitle: string,
  optionValue: string
) => `${productTitle} - ${optionValue}`

export type PlannedPresetVariant = {
  optionTitle: string
  optionValue: string
  title: string
  sku: string
  inventoryTitle: string
}

export const buildPlannedPresetVariants = (
  product: ProductWithVariantsRecord,
  preset: ProductVariantPreset
): PlannedPresetVariant[] => {
  const handle = product.handle ?? "product"
  const title = product.title ?? "Product"

  return preset.values.map((optionValue) => ({
    optionTitle: preset.optionTitle,
    optionValue,
    title: generatePresetVariantTitle(optionValue),
    sku: generatePresetVariantSku(handle, optionValue),
    inventoryTitle: generatePresetInventoryTitle(
      title,
      preset.optionTitle,
      optionValue
    ),
  }))
}

export const getExistingPresetValues = (
  product: ProductWithVariantsRecord,
  optionTitle: string
) => {
  const values = new Set<string>()

  for (const variant of product.variants ?? []) {
    for (const option of variant.options ?? []) {
      if (option.option?.title === optionTitle && option.value) {
        values.add(option.value)
      }
    }
  }

  return values
}
