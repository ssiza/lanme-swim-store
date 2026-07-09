import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { buildOrderEmailTotals } from "../lib/order-email-money"
import { buildAccountUrl, buildOrderUrl } from "../lib/storefront-urls"
import { sendNotificationStep } from "./steps/send-notification"

type WorkflowInput = {
  id: string
}

export const sendOrderConfirmationWorkflow = createWorkflow(
  "send-order-confirmation",
  ({ id }: WorkflowInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "total",
        "item_subtotal",
        "shipping_total",
        "tax_total",
        "summary.current_order_total",
        "items.title",
        "items.quantity",
        "items.unit_price",
      ],
      filters: {
        id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    })

    const notifications = transform({ orders }, ({ orders }) => {
      const order = orders[0]

      if (!order?.email) {
        return []
      }

      const totals = buildOrderEmailTotals(order as Parameters<typeof buildOrderEmailTotals>[0])

      return [
        {
          to: order.email,
          channel: "email",
          template: "order-placed",
          idempotency_key: `order-placed-${order.id}`,
          data: {
            event_name: "order.placed",
            display_id: order.display_id,
            order_id: order.id,
            email: order.email,
            currency_code: order.currency_code,
            headline_total: totals.headline_total,
            item_subtotal: totals.item_subtotal,
            shipping_total: totals.shipping_total,
            tax_total: totals.tax_total,
            total: totals.total,
            items: totals.items,
            order_url: buildOrderUrl(order.id),
            account_url: buildAccountUrl(),
          },
        },
      ]
    })

    const notification = when(
      { orders },
      (data) => !!data.orders[0]?.email
    ).then(() => sendNotificationStep(notifications))

    return new WorkflowResponse({
      notification,
    })
  }
)
