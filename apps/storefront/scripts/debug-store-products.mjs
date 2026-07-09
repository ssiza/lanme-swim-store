#!/usr/bin/env node
/**
 * Debug Medusa store product visibility for a country/region.
 *
 * Usage:
 *   NEXT_PUBLIC_MEDUSA_BACKEND_URL=... \
 *   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_... \
 *   node scripts/debug-store-products.mjs us
 */

const backendUrl = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
).replace(/\/$/, "")
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const countryCode = (process.argv[2] || "us").toLowerCase()

if (!publishableKey) {
  console.error("Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY")
  process.exit(1)
}

const headers = {
  "x-publishable-api-key": publishableKey,
  accept: "application/json",
}

async function getJson(path) {
  const url = `${backendUrl}${path}`
  const response = await fetch(url, { headers, cache: "no-store" })
  const text = await response.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  return { url, status: response.status, body }
}

function findRegionForCountry(regions, code) {
  return regions.find((region) =>
    region.countries?.some((country) => country.iso_2?.toLowerCase() === code)
  )
}

const regionsResult = await getJson("/store/regions")
const regions = regionsResult.body?.regions ?? []
const region = findRegionForCountry(regions, countryCode)

console.log(
  JSON.stringify(
    {
      backendUrl,
      hasPublishableKey: Boolean(publishableKey),
      countryCode,
      regions: {
        status: regionsResult.status,
        count: regions.length,
        items: regions.map((r) => ({
          id: r.id,
          name: r.name,
          currency_code: r.currency_code,
          countries: r.countries?.map((c) => c.iso_2),
        })),
      },
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

const productsResult = await getJson(
  `/store/products?limit=20&region_id=${region.id}&fields=id,title,handle,status`
)

const products = productsResult.body?.products ?? []

console.log(
  JSON.stringify(
    {
      productsRequest: {
        status: productsResult.status,
        regionId: region.id,
        count: productsResult.body?.count ?? products.length,
        handles: products.map((p) => p.handle),
        titles: products.map((p) => p.title),
      },
    },
    null,
    2
  )
)

if (productsResult.status !== 200) {
  console.error("Products request failed:", productsResult.body)
  process.exit(1)
}

if (!products.length) {
  console.warn(
    "API returned zero products. Check: published status, sales channel assignment on the product, publishable key sales channel link, and variant prices for",
    region.currency_code
  )
}
