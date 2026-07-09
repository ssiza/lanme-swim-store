export type VariantOptionRecord = {
  value?: string | null
  option?: {
    title?: string | null
  } | null
}

export type VariantRecord = {
  id?: string
  title?: string | null
  sku?: string | null
  manage_inventory?: boolean
  options?: VariantOptionRecord[] | null
  inventory_items?: Array<{
    inventory_item_id?: string | null
    inventory?: InventoryItemRecord | null
  }> | null
}

export type InventoryLevelRecord = {
  id?: string
  location_id?: string
  stocked_quantity?: number | null
}

export type InventoryItemRecord = {
  id?: string
  sku?: string | null
  title?: string | null
  location_levels?: InventoryLevelRecord[] | null
}

export type ProductRecord = {
  id?: string
  title?: string | null
  handle?: string | null
  status?: string | null
  variants?: VariantRecord[] | null
}

const DEFAULT_VARIANT_TITLES = new Set(["default variant"])
export const PREFERRED_SALES_CHANNEL_NAME = "Lanmè Swim Online Store"
export const DEFAULT_STOCK_QUANTITY = 1000

const DEFAULT_OPTION_TITLES = new Set(["default", "default option"])
const DEFAULT_OPTION_VALUES = new Set([
  "default",
  "default option value",
  "default variant",
])

export const slugToSkuPart = (value: string) =>
  value
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()

export const getMeaningfulVariantOptions = (options: VariantOptionRecord[] = []) =>
  options.filter((option) => {
    const title = option.option?.title?.trim().toLowerCase() ?? ""
    const value = option.value?.trim().toLowerCase() ?? ""

    if (!value) {
      return false
    }

    if (DEFAULT_OPTION_TITLES.has(title)) {
      return false
    }

    if (DEFAULT_OPTION_VALUES.has(value)) {
      return false
    }

    return true
  })

export const generateVariantSku = (
  productHandle: string,
  variant: Pick<VariantRecord, "title" | "options">
) => {
  const base = slugToSkuPart(productHandle || "PRODUCT")
  const meaningfulOptions = getMeaningfulVariantOptions(variant.options ?? [])

  if (meaningfulOptions.length > 0) {
    const optionParts = meaningfulOptions
      .map((option) => slugToSkuPart(option.value ?? ""))
      .filter(Boolean)

    return [base, ...optionParts].join("-")
  }

  const variantTitle = variant.title?.trim()
  if (variantTitle) {
    const normalizedTitle = variantTitle.toLowerCase()
    if (!DEFAULT_VARIANT_TITLES.has(normalizedTitle)) {
      const titlePart = slugToSkuPart(variantTitle)
      if (titlePart && titlePart !== base) {
        return `${base}-${titlePart}`
      }
    }
  }

  return `${base}-DEFAULT`
}

export const generateInventoryTitle = (
  productTitle: string,
  variant: Pick<VariantRecord, "title" | "options">
) => {
  const meaningfulOptions = getMeaningfulVariantOptions(variant.options ?? [])

  if (meaningfulOptions.length > 0) {
    return `${productTitle} - ${meaningfulOptions
      .map((option) => option.value)
      .filter(Boolean)
      .join(" / ")}`
  }

  if (variant.title?.trim()) {
    return `${productTitle} - ${variant.title.trim()}`
  }

  return productTitle
}

export const getLinkedInventoryItem = (
  variant: VariantRecord
): InventoryItemRecord | null => {
  const links = variant.inventory_items ?? []

  for (const entry of links) {
    if (entry.inventory?.id) {
      return entry.inventory
    }
  }

  return null
}

export const getLocationLevel = (
  inventoryItem: InventoryItemRecord | null | undefined,
  locationId: string
) =>
  inventoryItem?.location_levels?.find(
    (level) => level.location_id === locationId
  ) ?? null

export type VariantInventoryPlan = {
  variantId: string
  productTitle: string
  productHandle: string
  sku: string
  inventoryTitle: string
  skip: boolean
  skipReason?: string
  createInventoryItem: boolean
  linkVariant: boolean
  createStockLevel: boolean
  updateStockLevel: boolean
  updateVariantSku: boolean
  setManageInventory: boolean
  targetStockQuantity: number
  existingInventoryItemId?: string
  existingInventoryLevelId?: string
}

export const planVariantInventory = ({
  product,
  variant,
  locationId,
  defaultStockQuantity = DEFAULT_STOCK_QUANTITY,
}: {
  product: ProductRecord
  variant: VariantRecord
  locationId: string
  defaultStockQuantity?: number
}): VariantInventoryPlan | null => {
  if (!variant.id) {
    return null
  }

  const generatedSku = generateVariantSku(product.handle ?? "", variant)
  const sku = variant.sku?.trim() || generatedSku
  const inventoryTitle = generateInventoryTitle(
    product.title ?? "Product",
    variant
  )
  const linkedInventoryItem = getLinkedInventoryItem(variant)
  const locationLevel = getLocationLevel(linkedInventoryItem, locationId)

  const plan: VariantInventoryPlan = {
    variantId: variant.id,
    productTitle: product.title ?? "Product",
    productHandle: product.handle ?? "",
    sku,
    inventoryTitle,
    skip: false,
    createInventoryItem: !linkedInventoryItem?.id,
    linkVariant: !linkedInventoryItem?.id,
    createStockLevel: false,
    updateStockLevel: false,
    updateVariantSku: !variant.sku?.trim(),
    setManageInventory: variant.manage_inventory !== true,
    targetStockQuantity: defaultStockQuantity,
    existingInventoryItemId: linkedInventoryItem?.id,
    existingInventoryLevelId: locationLevel?.id,
  }

  if (linkedInventoryItem?.id && locationLevel) {
    const stockedQuantity = Number(locationLevel.stocked_quantity ?? 0)

    if (stockedQuantity > 0) {
      plan.skip = true
      plan.skipReason = "inventory item already linked with stocked quantity"
      return plan
    }

    plan.updateStockLevel = true
    return plan
  }

  if (linkedInventoryItem?.id && !locationLevel) {
    plan.createStockLevel = true
    return plan
  }

  return plan
}
