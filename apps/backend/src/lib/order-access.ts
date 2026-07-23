import crypto from "crypto"
import type { Lanme SwimContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

const getSecret = () =>
  process.env.ORDER_ACCESS_SECRET ||
  process.env.JWT_SECRET ||
  "dev-order-access-secret"

export function createOrderAccessToken(orderId: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const expiresAt = Date.now() + TOKEN_TTL_MS
  const payload = `${orderId}|${normalizedEmail}|${expiresAt}`
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex")

  return Buffer.from(`${payload}|${signature}`).toString("base64url")
}

export function verifyOrderAccessToken(orderId: string, token: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8")
    const parts = decoded.split("|")

    if (parts.length !== 4) {
      return null
    }

    const [tokenOrderId, email, expiresAt, signature] = parts

    if (tokenOrderId !== orderId) {
      return null
    }

    const payload = `${tokenOrderId}|${email}|${expiresAt}`
    const expectedSignature = crypto
      .createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex")

    if (signature !== expectedSignature) {
      return null
    }

    if (Date.now() > Number(expiresAt)) {
      return null
    }

    return { email }
  } catch {
    return null
  }
}

type OrderEmailRecord = {
  id: string
  email?: string | null
}

export async function findOrderByEmailMatch(
  container: Lanme SwimContainer,
  orderId: string,
  email: string
): Promise<OrderEmailRecord | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "email"],
    filters: {
      id: orderId,
      is_draft_order: false,
    },
  })

  const order = (orders?.[0] ?? null) as OrderEmailRecord | null

  if (!order?.id) {
    return null
  }

  if (order.email?.trim().toLowerCase() !== email.trim().toLowerCase()) {
    return null
  }

  return order
}

const verifyAttempts = new Map<string, { count: number; resetAt: number }>()

export function assertOrderVerifyAllowed(key: string, limit = 10) {
  const now = Date.now()
  const entry = verifyAttempts.get(key)

  if (!entry || entry.resetAt <= now) {
    verifyAttempts.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return
  }

  entry.count += 1

  if (entry.count > limit) {
    const error = new Error(
      "Too many verification attempts. Please try again later."
    )
    ;(error as Error & { statusCode?: number }).statusCode = 429
    throw error
  }
}
