import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { buildVerifyAccountUrl } from "../lib/storefront-urls"

type VerificationEventData = {
  entity_id: string
  actor_type?: string
  code: string
  expires_at?: string
}

export default async function verificationRequestedHandler({
  event: { data },
  container,
}: SubscriberArgs<VerificationEventData>) {
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
    template: "verification",
    idempotency_key: `verification-${data.entity_id}-${data.code}`,
    data: {
      email: data.entity_id,
      verification_url: buildVerifyAccountUrl(data.code),
      expires_at: data.expires_at,
    },
  })
}

export const config: SubscriberConfig = {
  event: "auth.verification_requested",
}
