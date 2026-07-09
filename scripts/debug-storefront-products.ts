#!/usr/bin/env npx tsx
/**
 * Diagnose Medusa storefront product visibility.
 *
 * Usage:
 *   NEXT_PUBLIC_MEDUSA_BACKEND_URL=... \
 *   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_... \
 *   npm run debug-storefront-products
 *
 * Optional admin checks (sales channel assignment):
 *   MEDUSA_ADMIN_API_TOKEN=... npm run debug-storefront-products
 */

const backendUrl = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
).replace(/\/$/, "")
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const adminToken = process.env.MEDUSA_ADMIN_API_TOKEN
const countryCode = (process.argv[2] || "us").toLowerCase()

if (!publishableKey) {
  console.error("Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY")
  process.exit(1)
}

type JsonRecord = Record<string, unknown>

const storeHeaders: Record<string, string> = {
  "x-publishable-api-key": publishableKey,
  accept: "application/json",
}

const adminHeaders: Record<string, string> = {
  accept: "application/json",
  ...(adminToken ? { authorization: `Bearer ${adminToken}` } : {}),
}

async function getJson(
  path: string,
  options: {
    admin?: boolean
    query?: Record<string, string | number | string[] | undefined>
  } = {}
) {
  const url = new URL(`${backendUrl}${path}`)

  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value === undefined) {
        continue
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, String(item))
        }
      } else {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const response = await fetch(url, {
    headers: options.admin ? adminHeaders : storeHeaders,
    cache: "no-store",
  })

  const text = await response.text()
  let body: unknown

  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }

  return { url: url.toString(), status: response.status, body }
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

function findRegionForCountry(
  regions: Array<{ id: string; name?: string; currency_code?: string; countries?: Array<{ iso_2?: string }> }>,
  code: string
) {
  return regions.find((region) =>
    region.countries?.some((country) => country.iso_2?.toLowerCase() === code)
  )
}

async function fetchAllStoreProducts(regionId: string) {
  const products: JsonRecord[] = []
  let offset = 0
  const limit = 100
  let total = 0

  while (true) {
    const result = await getJson("/store/products", {
      query: {
        region_id: regionId,
        limit,
        offset,
        fields:
          "id,title,handle,status,*variants,*tags,*collection,*categories",
      },
    })

    if (result.status !== 200) {
      throw new Error(
        `Store products request failed (${result.status}): ${JSON.stringify(result.body)}`
      )
    }

    const body = result.body as { products?: JsonRecord[]; count?: number }
    const batch = body.products ?? []
    total = body.count ?? batch.length

    products.push(...batch)

    if (!batch.length || products.length >= total) {
      break
    }

    offset += limit
  }

  return { products, count: total }
}

function groupBy<T extends JsonRecord>(
  items: T[],
  getKey: (item: T) => string | undefined | null
) {
  const groups = new Map<string, string[]>()

  for (const item of items) {
    const key = getKey(item) || "(none)"
    const title = String(item.title ?? item.name ?? item.handle ?? item.id)
    const list = groups.get(key) ?? []
    list.push(title)
    groups.set(key, list)
  }

  return Object.fromEntries(
    [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, titles]) => [key, { count: titles.length, products: titles }])
  )
}

function productHasUsdPrice(product: JsonRecord) {
  const variants = asArray(product.variants as JsonRecord[] | JsonRecord | undefined)

  return variants.some((variant) => {
    const calculatedPrices = asArray(
      variant.calculated_price as JsonRecord | JsonRecord[] | undefined
    )
    const rawPrices = asArray(
      variant.prices as JsonRecord[] | JsonRecord | undefined
    )

    return (
      calculatedPrices.some((price) => price.currency_code === "usd") ||
      rawPrices.some((price) => price.currency_code === "usd")
    )
  })
}

function productHasVariants(product: JsonRecord) {
  return asArray(product.variants as JsonRecord[] | JsonRecord | undefined).length > 0
}

async function fetchAdminProducts() {
  if (!adminToken) {
    return null
  }

  const products: JsonRecord[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const result = await getJson("/admin/products", {
      admin: true,
      query: {
        limit,
        offset,
        fields:
          "id,title,handle,status,*sales_channels,*variants,*variants.prices",
      },
    })

    if (result.status !== 200) {
      console.warn(
        "Admin products request failed; skipping admin-only checks:",
        result.status,
        result.body
      )
      return null
    }

    const body = result.body as { products?: JsonRecord[]; count?: number }
    const batch = body.products ?? []
    products.push(...batch)

    if (!batch.length || products.length >= (body.count ?? batch.length)) {
      break
    }

    offset += limit
  }

  return products
}

async function main() {
  console.log("Lanmè Swim storefront product diagnostics\n")

  const regionsResult = await getJson("/store/regions")
  const regions =
    (regionsResult.body as { regions?: Array<{ id: string; name?: string; currency_code?: string; countries?: Array<{ iso_2?: string }> }> })
      ?.regions ?? []
  const region = findRegionForCountry(regions, countryCode)

  console.log(
    JSON.stringify(
      {
        backendUrl,
        hasPublishableKey: Boolean(publishableKey),
        hasAdminToken: Boolean(adminToken),
        countryCode,
        resolvedRegion: region
          ? {
              id: region.id,
              name: region.name,
              currency_code: region.currency_code,
            }
          : null,
      },
      null,
      2
    )
  )

  if (!region) {
    console.error(`No region found for country code "${countryCode}"`)
    process.exit(1)
  }

  const { products, count } = await fetchAllStoreProducts(region.id)

  console.log("\n--- Store API: /store/products ---")
  console.log(
    JSON.stringify(
      {
        totalProducts: count,
        returnedProducts: products.length,
        handles: products.map((product) => product.handle),
      },
      null,
      2
    )
  )

  const collectionsResult = await getJson("/store/collections", {
    query: { limit: 100, fields: "id,title,handle" },
  })
  const collections =
    (collectionsResult.body as { collections?: JsonRecord[] })?.collections ?? []

  const productsByCollection: Record<string, { count: number; products: string[] }> =
    {}

  for (const collection of collections) {
    const collectionId = String(collection.id)
    const result = await getJson("/store/products", {
      query: {
        region_id: region.id,
        collection_id: collectionId,
        limit: 100,
        fields: "id,title,handle",
      },
    })

    const collectionProducts =
      (result.body as { products?: JsonRecord[] })?.products ?? []

    productsByCollection[String(collection.title ?? collection.handle ?? collectionId)] =
      {
        count: collectionProducts.length,
        products: collectionProducts.map((product) => String(product.handle)),
      }
  }

  console.log("\n--- Products by collection ---")
  console.log(JSON.stringify(productsByCollection, null, 2))

  const categoriesResult = await getJson("/store/product-categories", {
    query: {
      limit: 100,
      include_descendants_tree: "true",
      fields: "id,name,handle,*category_children",
    },
  })

  const categories =
    (categoriesResult.body as { product_categories?: JsonRecord[] })
      ?.product_categories ?? []

  const collectCategoryIds = (category: JsonRecord): string[] => {
    const ids = [String(category.id)]
    for (const child of asArray(
      category.category_children as JsonRecord[] | JsonRecord | undefined
    )) {
      ids.push(...collectCategoryIds(child))
    }
    return ids
  }

  const productsByCategory: Record<string, { count: number; products: string[] }> =
    {}

  for (const category of categories) {
    const categoryIds = collectCategoryIds(category)
    const result = await getJson("/store/products", {
      query: {
        region_id: region.id,
        limit: 100,
        fields: "id,title,handle",
        category_id: categoryIds,
      },
    })

    const categoryProducts =
      (result.body as { products?: JsonRecord[] })?.products ?? []

    productsByCategory[String(category.name ?? category.handle ?? category.id)] = {
      count: categoryProducts.length,
      products: categoryProducts.map((product) => String(product.handle)),
    }
  }

  console.log("\n--- Products by category ---")
  console.log(JSON.stringify(productsByCategory, null, 2))

  console.log("\n--- Products by tag ---")
  console.log(
    JSON.stringify(
      groupBy(products, (product) => {
        const tags = asArray(product.tags as JsonRecord[] | JsonRecord | undefined)
        return tags.map((tag) => String(tag.value ?? tag.id)).join(", ") || "(none)"
      }),
      null,
      2
    )
  )

  const storeMissingVariants = products
    .filter((product) => !productHasVariants(product))
    .map((product) => String(product.handle ?? product.id))

  const storeMissingUsdPrice = products
    .filter((product) => !productHasUsdPrice(product))
    .map((product) => String(product.handle ?? product.id))

  console.log("\n--- Store-visible product issues ---")
  console.log(
    JSON.stringify(
      {
        missingVariants: storeMissingVariants,
        missingUsdPrice: storeMissingUsdPrice,
      },
      null,
      2
    )
  )

  const adminProducts = await fetchAdminProducts()

  if (adminProducts) {
    const missingSalesChannel = adminProducts
      .filter((product) => {
        const channels = asArray(
          product.sales_channels as JsonRecord[] | JsonRecord | undefined
        )
        return product.status === "published" && channels.length === 0
      })
      .map((product) => String(product.handle ?? product.id))

    const adminMissingVariants = adminProducts
      .filter((product) => product.status === "published" && !productHasVariants(product))
      .map((product) => String(product.handle ?? product.id))

    const adminMissingUsdPrice = adminProducts
      .filter(
        (product) => product.status === "published" && !productHasUsdPrice(product)
      )
      .map((product) => String(product.handle ?? product.id))

    const unpublishedWithInventory = adminProducts
      .filter((product) => product.status !== "published")
      .map((product) => String(product.handle ?? product.id))

    console.log("\n--- Admin product issues ---")
    console.log(
      JSON.stringify(
        {
          publishedMissingSalesChannel: missingSalesChannel,
          publishedMissingVariants: adminMissingVariants,
          publishedMissingUsdPrice: adminMissingUsdPrice,
          unpublishedProducts: unpublishedWithInventory,
        },
        null,
        2
      )
    )
  } else {
    console.log(
      "\n--- Admin product issues ---\nSet MEDUSA_ADMIN_API_TOKEN to check sales channel assignment and unpublished products."
    )
  }

  if (!products.length) {
    console.warn(
      "\nStore API returned zero products. Verify: published status, sales channel assignment, publishable key ↔ sales channel link, and USD/EUR prices for the region."
    )
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
