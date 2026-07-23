import type { Lanme SwimContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export type OrderEmailContext = {
  order_id: string
  fulfillment_id?: string | null
  display_id?: number | string | null
  email?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
}

type FulfillmentLabel = {
  tracking_number?: string | null
  tracking_url?: string | null
}

type FulfillmentRecord = {
  id: string
  labels?: FulfillmentLabel[] | null
}

type OrderRecord = {
  id: string
  display_id?: number | string | null
  email?: string | null
  fulfillments?: FulfillmentRecord[] | null
}

export async function loadOrderEmailContextByOrderId(
  container: Lanme SwimContainer,
  orderId: string,
  fulfillmentId?: string | null
): Promise<OrderEmailContext | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    filters: { id: orderId },
    fields: [
      "id",
      "display_id",
      "email",
      "fulfillments.id",
      "fulfillments.labels.tracking_number",
      "fulfillments.labels.tracking_url",
    ],
  })

  const order = (orders?.[0] ?? null) as OrderRecord | null

  if (!order?.id) {
    return null
  }

  const fulfillment = fulfillmentId
    ? order.fulfillments?.find((entry) => entry.id === fulfillmentId)
    : order.fulfillments?.[0]

  const label = fulfillment?.labels?.find(
    (entry) => entry.tracking_number || entry.tracking_url
  )

  return {
    order_id: order.id,
    fulfillment_id: fulfillment?.id ?? fulfillmentId ?? null,
    display_id: order.display_id,
    email: order.email,
    tracking_number: label?.tracking_number ?? null,
    tracking_url: label?.tracking_url ?? null,
  }
}

export async function loadOrderEmailContextByFulfillmentId(
  container: Lanme SwimContainer,
  fulfillmentId: string
): Promise<OrderEmailContext | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: fulfillments } = await query.graph({
    entity: "fulfillment",
    filters: { id: fulfillmentId },
    fields: [
      "id",
      "labels.tracking_number",
      "labels.tracking_url",
      "order.id",
      "order.display_id",
      "order.email",
    ],
  })

  const fulfillment = (fulfillments?.[0] ?? null) as
    | (FulfillmentRecord & {
        order?: {
          id?: string
          display_id?: number | string | null
          email?: string | null
        } | null
      })
    | null

  if (!fulfillment?.order?.id) {
    return null
  }

  const label = fulfillment.labels?.find(
    (entry) => entry.tracking_number || entry.tracking_url
  )

  return {
    order_id: fulfillment.order.id,
    fulfillment_id: fulfillment.id,
    display_id: fulfillment.order.display_id,
    email: fulfillment.order.email,
    tracking_number: label?.tracking_number ?? null,
    tracking_url: label?.tracking_url ?? null,
  }
}
