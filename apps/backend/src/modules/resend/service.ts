import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import { CreateEmailOptions, Resend } from "resend"
import { orderPlacedEmail } from "./emails/order-placed"
import {
  orderDeliveredEmail,
  orderFulfillmentPreparingEmail,
  orderShippedEmail,
} from "./emails/order-lifecycle"
import { passwordResetEmail } from "./emails/password-reset"
import { supportTicketAdminNotificationEmail } from "./emails/support-ticket-admin-notification"
import { supportTicketConfirmationEmail } from "./emails/support-ticket-confirmation"
import { supportTicketReplyEmail } from "./emails/support-ticket-reply"
import { verificationEmail } from "./emails/verification"

export enum EmailTemplates {
  ORDER_PLACED = "order-placed",
  ORDER_FULFILLMENT_PREPARING = "order-fulfillment-preparing",
  ORDER_SHIPPED = "order-shipped",
  ORDER_DELIVERED = "order-delivered",
  VERIFICATION = "verification",
  PASSWORD_RESET = "password-reset",
  SUPPORT_TICKET_CONFIRMATION = "support-ticket-confirmation",
  SUPPORT_TICKET_ADMIN_NOTIFICATION = "support-ticket-admin-notification",
  SUPPORT_TICKET_REPLY = "support-ticket-reply",
}

const templates: Record<
  EmailTemplates,
  (props: Record<string, unknown>) => ReturnType<typeof orderPlacedEmail>
> = {
  [EmailTemplates.ORDER_PLACED]: (props) => orderPlacedEmail(props),
  [EmailTemplates.ORDER_FULFILLMENT_PREPARING]: (props) =>
    orderFulfillmentPreparingEmail(props),
  [EmailTemplates.ORDER_SHIPPED]: (props) => orderShippedEmail(props),
  [EmailTemplates.ORDER_DELIVERED]: (props) => orderDeliveredEmail(props),
  [EmailTemplates.VERIFICATION]: (props) => verificationEmail(props),
  [EmailTemplates.PASSWORD_RESET]: (props) => passwordResetEmail(props),
  [EmailTemplates.SUPPORT_TICKET_CONFIRMATION]: (props) =>
    supportTicketConfirmationEmail(props),
  [EmailTemplates.SUPPORT_TICKET_ADMIN_NOTIFICATION]: (props) =>
    supportTicketAdminNotificationEmail(props),
  [EmailTemplates.SUPPORT_TICKET_REPLY]: (props) =>
    supportTicketReplyEmail(props),
}

const templateSubjects: Record<EmailTemplates, string> = {
  [EmailTemplates.ORDER_PLACED]: "Your Lanmè Swim order is confirmed",
  [EmailTemplates.ORDER_FULFILLMENT_PREPARING]:
    "Your Lanmè Swim order is being prepared",
  [EmailTemplates.ORDER_SHIPPED]: "Your Lanmè Swim order has shipped",
  [EmailTemplates.ORDER_DELIVERED]: "Your Lanmè Swim order was delivered",
  [EmailTemplates.VERIFICATION]: "Verify your Lanmè Swim email",
  [EmailTemplates.PASSWORD_RESET]: "Reset your Lanmè Swim password",
  [EmailTemplates.SUPPORT_TICKET_CONFIRMATION]:
    "We received your Lanmè Swim support request",
  [EmailTemplates.SUPPORT_TICKET_ADMIN_NOTIFICATION]:
    "New Lanmè Swim customer service request",
  [EmailTemplates.SUPPORT_TICKET_REPLY]: "Reply from Lanmè Swim support",
}

export type ResendNotificationOptions = {
  api_key: string
  from: string
  from_name?: string
  reply_to?: string
  dev_redirect?: string
}

type InjectedDependencies = {
  logger: Logger
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"

  private resendClient: Resend
  private options: ResendNotificationOptions
  private logger: Logger

  constructor({ logger }: InjectedDependencies, options: ResendNotificationOptions) {
    super()
    this.resendClient = new Resend(options.api_key)
    this.options = options
    this.logger = logger
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `api_key` is required in the Resend notification provider."
      )
    }

    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `from` is required in the Resend notification provider."
      )
    }
  }

  private formatFromAddress() {
    const { from, from_name } = this.options

    if (from_name && !from.includes("<")) {
      return `${from_name} <${from}>`
    }

    return from
  }

  private resolveTemplate(template: string) {
    const allowed = Object.values(EmailTemplates)

    if (!allowed.includes(template as EmailTemplates)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unknown email template "${template}". Valid templates: ${allowed.join(", ")}`
      )
    }

    return templates[template as EmailTemplates]
  }

  private resolveSubject(template: string, data?: Record<string, unknown>) {
    if (typeof data?.subject === "string" && data.subject.length > 0) {
      return data.subject
    }

    return templateSubjects[template as EmailTemplates]
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    if (!notification) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No notification information provided."
      )
    }

    const templateRenderer = this.resolveTemplate(notification.template)
    const subject = this.resolveSubject(
      notification.template,
      notification.data as Record<string, unknown> | undefined
    )

    const recipient = this.options.dev_redirect || notification.to

    if (this.options.dev_redirect && notification.to !== this.options.dev_redirect) {
      this.logger.info(
        `Resend dev_redirect active: sending "${notification.template}" intended for ${notification.to} to ${this.options.dev_redirect}`
      )
    }

    const renderedTemplate = templateRenderer(
      (notification.data || {}) as Record<string, unknown>
    )

    const emailOptions = {
      from: this.formatFromAddress(),
      to: [recipient],
      subject,
      react: renderedTemplate,
      ...(this.options.reply_to ? { reply_to: this.options.reply_to } : {}),
    } as CreateEmailOptions

    const { data, error } = await this.resendClient.emails.send(emailOptions)

    if (error) {
      this.logger.error(
        `[order-email] event=resend.send template=${notification.template} recipient=${recipient} order_id=${String((notification.data as Record<string, unknown> | undefined)?.order_id ?? "")} fulfillment_id=${String((notification.data as Record<string, unknown> | undefined)?.fulfillment_id ?? "")} error=${error.message}`
      )
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email via Resend: ${error.message}`
      )
    }

    if (!data?.id) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Failed to send email via Resend: no message id returned."
      )
    }

    this.logger.info(
      `[order-email] event=resend.send template=${notification.template} recipient=${recipient} order_id=${String((notification.data as Record<string, unknown> | undefined)?.order_id ?? "")} fulfillment_id=${String((notification.data as Record<string, unknown> | undefined)?.fulfillment_id ?? "")} provider_response=${data.id}`
    )

    return { id: data.id }
  }
}

export default ResendNotificationProviderService
