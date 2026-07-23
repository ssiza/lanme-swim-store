import type { Lanme SwimContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export type AdminFeedNotificationInput = {
  title: string
  description?: string
  idempotency_key?: string
  data?: Record<string, unknown>
}

export const buildAdminOrderUrl = (orderId: string) => {
  const backendBase = (
    process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
  ).replace(/\/$/, "")

  return `${backendBase}/app/orders/${orderId}`
}

export async function createAdminFeedNotification(
  container: Lanme SwimContainer,
  input: AdminFeedNotificationInput
) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  await notificationModuleService.createNotifications({
    to: "",
    channel: "feed",
    template: "admin-ui",
    idempotency_key: input.idempotency_key,
    data: {
      title: input.title,
      ...(input.description ? { description: input.description } : {}),
      ...input.data,
    },
  })
}

export async function createOrderPlacedAdminFeedNotification(
  container: Lanme SwimContainer,
  orderId: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "email", "total", "currency_code"],
    filters: {
      id: orderId,
    },
  })

  const order = orders?.[0] as
    | {
        id?: string
        display_id?: number | string | null
        email?: string | null
        total?: number | string | null
        currency_code?: string | null
      }
    | undefined

  if (!order?.id) {
    return
  }

  const orderLabel = order.display_id ? `#${order.display_id}` : order.id
  const customer = order.email ? ` from ${order.email}` : ""

  await createAdminFeedNotification(container, {
    idempotency_key: `order-placed-feed-${order.id}`,
    title: `Order ${orderLabel} placed`,
    description: `A new order was placed${customer}.`,
    data: {
      order_id: order.id,
      admin_url: buildAdminOrderUrl(order.id),
    },
  })
}
