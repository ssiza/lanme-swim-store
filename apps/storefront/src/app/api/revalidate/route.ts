import { revalidateDiscoveryCache } from "@lib/revalidation"

export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret")
  const expectedSecret = process.env.REVALIDATE_SECRET

  if (!expectedSecret || secret !== expectedSecret) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  let body: {
    tags?: Array<"products" | "collections" | "categories" | "homepage">
    paths?: string[]
    productHandle?: string | null
    countryCodes?: string[]
  } = {}

  try {
    body = await request.json()
  } catch {
    // Empty body is valid — revalidate all discovery caches.
  }

  const result = revalidateDiscoveryCache(body)

  console.log(
    JSON.stringify({
      event: "storefront.revalidate",
      ...result,
      timestamp: new Date().toISOString(),
    })
  )

  return Response.json(result)
}
