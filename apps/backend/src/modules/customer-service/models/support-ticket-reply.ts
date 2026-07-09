import { model } from "@medusajs/framework/utils"

const SupportTicketReply = model.define("support_ticket_reply", {
  id: model.id().primaryKey(),
  ticket_id: model.text(),
  admin_user_id: model.text().nullable(),
  message: model.text(),
})

export default SupportTicketReply
