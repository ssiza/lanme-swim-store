import { model } from "@medusajs/framework/utils"
import { SUPPORT_STATUSES, SUPPORT_TOPICS } from "../constants"

const SupportTicket = model.define("support_ticket", {
  id: model.id().primaryKey(),
  name: model.text(),
  email: model.text(),
  order_id: model.text().nullable(),
  order_display_id: model.text().nullable(),
  topic: model.enum([...SUPPORT_TOPICS]),
  message: model.text(),
  status: model.enum([...SUPPORT_STATUSES]).default("open"),
})

export default SupportTicket
