import type { Lanme SwimRequest, Lanme SwimResponse } from "@medusajs/framework/http"
import { Lanme SwimError } from "@medusajs/framework/utils"
import {
  assertOrderVerifyAllowed,
  createOrderAccessToken,
  findOrderByEmailMatch,
} from "../../../../lib/order-access"
import type { StoreVerifyOrderAccessType } from "./validators"

export async function POST(req: Lanme SwimRequest, res: Lanme SwimResponse) {
  const body = req.validatedBody as StoreVerifyOrderAccessType
  const rateLimitKey = `${body.email.trim().toLowerCase()}:${req.ip || "unknown"}`

  try {
    assertOrderVerifyAllowed(rateLimitKey)
  } catch (error) {
    throw new Lanme SwimError(
      Lanme SwimError.Types.NOT_ALLOWED,
      error instanceof Error ? error.message : "Too many requests"
    )
  }

  const order = await findOrderByEmailMatch(
    req.scope,
    body.order_id,
    body.email
  )

  if (!order) {
    throw new Lanme SwimError(
      Lanme SwimError.Types.NOT_FOUND,
      "We could not verify that order with the email provided."
    )
  }

  const access_token = createOrderAccessToken(order.id, body.email)

  res.status(200).json({
    access_token,
    order_id: order.id,
  })
}
