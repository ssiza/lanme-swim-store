import type { Logger } from "@medusajs/framework/types"

export type OrderEmailLogPayload = {
  event_name: string
  order_id?: string | null
  fulfillment_id?: string | null
  recipient_email?: string | null
  template?: string | null
  provider_response?: string | null
  error_message?: string | null
  skipped?: boolean
  skip_reason?: string | null
}

export function logOrderEmailEvent(
  logger: Logger,
  payload: OrderEmailLogPayload
) {
  const parts = [
    `[order-email] event=${payload.event_name}`,
    payload.order_id ? `order_id=${payload.order_id}` : null,
    payload.fulfillment_id ? `fulfillment_id=${payload.fulfillment_id}` : null,
    payload.recipient_email ? `recipient=${payload.recipient_email}` : null,
    payload.template ? `template=${payload.template}` : null,
    payload.skipped ? `skipped=true` : null,
    payload.skip_reason ? `skip_reason=${payload.skip_reason}` : null,
    payload.provider_response
      ? `provider_response=${payload.provider_response}`
      : null,
    payload.error_message ? `error=${payload.error_message}` : null,
  ].filter(Boolean)

  if (payload.error_message) {
    logger.error(parts.join(" "))
    return
  }

  if (payload.skipped) {
    logger.info(parts.join(" "))
    return
  }

  logger.info(parts.join(" "))
}
