import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { buildPasswordResetUrl } from "../lib/storefront-urls"

type PasswordResetEventData = {
  entity_id: string
  token: string
  actor_type?: string
}

export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<PasswordResetEventData>) {
  if (!process.env.RESEND_API_KEY) {
    return
  }

  if (data.actor_type && data.actor_type !== "customer") {
    return
  }

  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  await notificationModuleService.createNotifications({
    to: data.entity_id,
    channel: "email",
    template: "password-reset",
    idempotency_key: `password-reset-${data.entity_id}-${data.token}`,
    data: {
      email: data.entity_id,
      reset_url: buildPasswordResetUrl(data.token, data.entity_id),
    },
  })
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
