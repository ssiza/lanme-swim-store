import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getOrderDetailWorkflow } from "@medusajs/core-flows"
import { MedusaError } from "@medusajs/framework/utils"
import { verifyOrderAccessToken } from "../../../../../lib/order-access"

const ORDER_DETAIL_FIELDS = [
  "id",
  "display_id",
  "email",
  "customer_id",
  "currency_code",
  "created_at",
  "status",
  "total",
  "subtotal",
  "item_subtotal",
  "shipping_total",
  "shipping_subtotal",
  "tax_total",
  "discount_total",
  "gift_card_total",
  "payment_status",
  "fulfillment_status",
  "*payment_collections.payments",
  "*items",
  "*items.metadata",
  "*items.variant",
  "*items.product",
  "shipping_address.*",
  "billing_address.*",
  "shipping_methods.*",
  "fulfillments.*",
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderId = req.params.id
  const accessToken = req.headers["x-order-access-token"]

  if (typeof accessToken !== "string" || !accessToken.length) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Order access token is required."
    )
  }

  const verified = verifyOrderAccessToken(orderId, accessToken)

  if (!verified) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Order access token is invalid or expired."
    )
  }

  const workflow = getOrderDetailWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      fields: ORDER_DETAIL_FIELDS,
      order_id: orderId,
      filters: {
        is_draft_order: false,
      },
    },
  })

  if (!result?.id) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found.")
  }

  if (
    result.email?.trim().toLowerCase() !== verified.email.trim().toLowerCase()
  ) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Order access token is invalid for this order."
    )
  }

  res.status(200).json({ order: result })
}
