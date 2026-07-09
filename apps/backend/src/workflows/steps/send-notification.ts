import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateNotificationDTO } from "@medusajs/framework/types"
import { logOrderEmailEvent } from "../../lib/order-email-log"

export const sendNotificationStep = createStep(
  "send-notification",
  async (notifications: CreateNotificationDTO[], { container }) => {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    for (const notification of notifications) {
      logOrderEmailEvent(logger, {
        event_name: String(notification.data?.event_name ?? "notification.send"),
        order_id:
          typeof notification.data?.order_id === "string"
            ? notification.data.order_id
            : null,
        fulfillment_id:
          typeof notification.data?.fulfillment_id === "string"
            ? notification.data.fulfillment_id
            : null,
        recipient_email: notification.to,
        template: notification.template,
      })
    }

    const result =
      await notificationModuleService.createNotifications(notifications)

    return new StepResponse(result)
  }
)
