import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { buildAdminInviteUrl } from "../lib/storefront-urls"

type InviteEventData = {
  id: string
}

export default async function inviteCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<InviteEventData>) {
  if (!process.env.RESEND_API_KEY) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const {
    data: [invite],
  } = await query.graph({
    entity: "invite",
    fields: ["id", "email", "token"],
    filters: {
      id: data.id,
    },
  })

  if (!invite?.email || !invite?.token) {
    logger.warn(
      `invite.created/resent: invite ${data.id} missing email or token — skipping email.`
    )
    return
  }

  const inviteUrl = buildAdminInviteUrl(invite.token)

  await notificationModuleService.createNotifications({
    to: invite.email,
    channel: "email",
    template: "user-invited",
    idempotency_key: `user-invited-${invite.id}-${invite.token}`,
    data: {
      email: invite.email,
      invite_url: inviteUrl,
    },
  })

  logger.info(
    `Sent admin invite email to ${invite.email} (invite ${invite.id}).`
  )
}

export const config: SubscriberConfig = {
  event: ["invite.created", "invite.resent"],
}
