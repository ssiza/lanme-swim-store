import { DEFAULT_STOCK_QUANTITY, slugToSkuPart } from "./inventory-generation"

export type InventoryPresetName =
  | "apparel-sizes"
  | "shorts-sizes"
  | "apparel-size-color"
  | "one-size"

export type InventoryPresetDimension = {
  optionTitle: string
  values: string[]
}

export type InventoryPreset = {
  name: InventoryPresetName
  label: string
  dimensions: InventoryPresetDimension[]
  defaultStockQuantity: number
}

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"] as const
const SHORTS_SIZES = ["XS", "S", "M", "L", "XL", "2XL"] as const
const APPAREL_COLORS = ["Black", "White", "Purple", "Gray", "Navy"] as const

export const INVENTORY_PRESETS: Record<InventoryPresetName, InventoryPreset> = {
  "apparel-sizes": {
    name: "apparel-sizes",
    label: "Apparel Sizes",
    dimensions: [{ optionTitle: "Size", values: [...APPAREL_SIZES] }],
    defaultStockQuantity: DEFAULT_STOCK_QUANTITY,
  },
  "shorts-sizes": {
    name: "shorts-sizes",
    label: "Shorts Sizes",
    dimensions: [{ optionTitle: "Size", values: [...SHORTS_SIZES] }],
    defaultStockQuantity: DEFAULT_STOCK_QUANTITY,
  },
  "apparel-size-color": {
    name: "apparel-size-color",
    label: "Apparel Size + Color",
    dimensions: [
      { optionTitle: "Size", values: [...APPAREL_SIZES] },
      { optionTitle: "Color", values: [...APPAREL_COLORS] },
    ],
    defaultStockQuantity: DEFAULT_STOCK_QUANTITY,
  },
  "one-size": {
    name: "one-size",
    label: "One Size",
    dimensions: [{ optionTitle: "Size", values: ["One Size"] }],
    defaultStockQuantity: DEFAULT_STOCK_QUANTITY,
  },
}

export const INVENTORY_PRESET_NAMES = Object.keys(
  INVENTORY_PRESETS
) as InventoryPresetName[]

export const getInventoryPreset = (name: string): InventoryPreset => {
  const preset = INVENTORY_PRESETS[name as InventoryPresetName]

  if (!preset) {
    throw new Error(
      `Unknown inventory preset "${name}". Available: ${INVENTORY_PRESET_NAMES.join(", ")}`
    )
  }

  return preset
}

export type ReusableInventorySpec = {
  key: string
  title: string
  sku: string
  options: Record<string, string>
}

const buildInventoryKey = (options: Record<string, string>) =>
  Object.entries(options)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([title, value]) => `${title}=${value}`)
    .join("|")

export const generateReusableInventoryTitle = (
  options: Record<string, string>
) => {
  const size = options.Size?.trim()
  const color = options.Color?.trim()

  if (size && color) {
    return `${size} / ${color}`
  }

  if (size) {
    return size === "One Size" ? "One Size" : size
  }

  if (color) {
    return color
  }

  return "Inventory Item"
}

export const generateReusableInventorySku = (
  options: Record<string, string>
) => {
  const size = options.Size?.trim()
  const color = options.Color?.trim()

  if (size === "One Size" && !color) {
    return "ONE-SIZE"
  }

  if (size && color) {
    return `APPAREL-${slugToSkuPart(size)}-${slugToSkuPart(color)}`
  }

  if (size) {
    return `APPAREL-${slugToSkuPart(size)}`
  }

  if (color) {
    return `APPAREL-${slugToSkuPart(color)}`
  }

  return "APPAREL-DEFAULT"
}

const cartesianOptionCombos = (
  dimensions: InventoryPresetDimension[]
): Record<string, string>[] => {
  if (dimensions.length === 0) {
    return []
  }

  return dimensions.reduce<Record<string, string>[]>(
    (combinations, dimension) => {
      if (combinations.length === 0) {
        return dimension.values.map((value) => ({
          [dimension.optionTitle]: value,
        }))
      }

      const next: Record<string, string>[] = []

      for (const combination of combinations) {
        for (const value of dimension.values) {
          next.push({
            ...combination,
            [dimension.optionTitle]: value,
          })
        }
      }

      return next
    },
    []
  )
}

export const buildReusableInventorySpecs = (
  preset: InventoryPreset
): ReusableInventorySpec[] => {
  const combos = cartesianOptionCombos(preset.dimensions)

  return combos.map((options) => {
    const title = generateReusableInventoryTitle(options)
    const sku = generateReusableInventorySku(options)

    return {
      key: buildInventoryKey(options),
      title,
      sku,
      options,
    }
  })
}

export type PlannedSetupVariant = {
  key: string
  title: string
  variantSku: string
  options: Record<string, string>
  inventory: ReusableInventorySpec
}

export const generateProductVariantSku = (
  productHandle: string,
  options: Record<string, string>
) => {
  const base = slugToSkuPart(productHandle || "PRODUCT")
  const parts = Object.values(options)
    .map((value) => slugToSkuPart(value))
    .filter(Boolean)

  return parts.length > 0 ? `${base}-${parts.join("-")}` : `${base}-DEFAULT`
}

export const generateSetupVariantTitle = (options: Record<string, string>) =>
  generateReusableInventoryTitle(options)

export const buildPlannedSetupVariants = (
  productHandle: string,
  preset: InventoryPreset
): PlannedSetupVariant[] =>
  buildReusableInventorySpecs(preset).map((inventory) => ({
    key: inventory.key,
    title: generateSetupVariantTitle(inventory.options),
    variantSku: generateProductVariantSku(productHandle, inventory.options),
    options: inventory.options,
    inventory,
  }))

export const getVariantOptionKey = (options: Record<string, string>) =>
  buildInventoryKey(options)
