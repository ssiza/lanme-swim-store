export const SUPPORT_TOPICS = [
  "order_issue",
  "shipping",
  "return_or_refund",
  "damaged_item",
  "wrong_item",
  "product_question",
  "other",
] as const

export type SupportTopic = (typeof SUPPORT_TOPICS)[number]

export const SUPPORT_TOPIC_LABELS: Record<SupportTopic, string> = {
  order_issue: "Order issue",
  shipping: "Shipping",
  return_or_refund: "Return or refund",
  damaged_item: "Damaged item",
  wrong_item: "Wrong item received",
  product_question: "Product question",
  other: "Other",
}

export const SUPPORT_STATUSES = ["open", "replied", "closed"] as const

export type SupportStatus = (typeof SUPPORT_STATUSES)[number]

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  open: "Open",
  replied: "Replied",
  closed: "Closed",
}

export const MAX_TICKETS_PER_EMAIL_PER_HOUR = 5
