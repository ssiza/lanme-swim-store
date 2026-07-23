import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { Lanme SwimContainer } from "@medusajs/framework"

type RevalidatePayload = {
  productHandle?: string | null
  event?: string
}

export async function revalidateStorefrontCache(
  container: Lanme SwimContainer,
  payload: RevalidatePayload = {}
): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const storefrontUrl = process.env.STOREFRONT_URL?.replace(/\/$/, "")
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET

  if (!storefrontUrl || !secret) {
    logger.warn(
      JSON.stringify({
        event: "storefront.revalidate.skipped",
        reason: "missing_storefront_url_or_secret",
        hasStorefrontUrl: Boolean(storefrontUrl),
        hasSecret: Boolean(secret),
      })
    )
    return
  }

  const url = `${storefrontUrl}/api/revalidate`

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({
        productHandle: payload.productHandle ?? null,
        countryCodes: process.env.STORE_DEFAULT_REGION
          ? [process.env.STORE_DEFAULT_REGION.toLowerCase()]
          : undefined,
      }),
      cache: "no-store",
    })

    const body = await response.text()

    if (!response.ok) {
      logger.warn(
        JSON.stringify({
          event: "storefront.revalidate.failed",
          status: response.status,
          url,
          medusaEvent: payload.event,
          body,
        })
      )
      return
    }

    logger.info(
      JSON.stringify({
        event: "storefront.revalidate.ok",
        url,
        medusaEvent: payload.event,
        productHandle: payload.productHandle ?? null,
        response: body,
      })
    )
  } catch (error) {
    logger.error(
      JSON.stringify({
        event: "storefront.revalidate.error",
        url,
        medusaEvent: payload.event,
        error: error instanceof Error ? error.message : String(error),
      })
    )
  }
}

export async function resolveProductHandle(
  container: Lanme SwimContainer,
  productId?: string | null
): Promise<string | null> {
  if (!productId) {
    return null
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product",
    fields: ["handle"],
    filters: { id: productId },
  })

  return data?.[0]?.handle ?? null
}
