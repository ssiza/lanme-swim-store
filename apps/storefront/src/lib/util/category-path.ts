import { HttpTypes } from "@medusajs/types"

/**
 * Build the storefront URL path segment for a category (supports nested categories).
 */
export function getCategoryPath(
  category: HttpTypes.StoreProductCategory
): string {
  const segments: string[] = []
  let current: HttpTypes.StoreProductCategory | null | undefined = category

  while (current) {
    if (current.handle) {
      segments.unshift(current.handle)
    }
    current = current.parent_category ?? null
  }

  return segments.join("/")
}

/**
 * Collect a category ID and all descendant category IDs for product filtering.
 */
export function collectDescendantCategoryIds(
  category: HttpTypes.StoreProductCategory
): string[] {
  const ids = new Set<string>()

  const walk = (node: HttpTypes.StoreProductCategory) => {
    if (node.id) {
      ids.add(node.id)
    }

    for (const child of node.category_children ?? []) {
      walk(child)
    }
  }

  walk(category)
  return [...ids]
}
