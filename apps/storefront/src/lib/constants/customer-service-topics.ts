export const SUPPORT_TOPICS = [
  { value: "order_issue", label: "Order issue" },
  { value: "shipping", label: "Shipping" },
  { value: "return_or_refund", label: "Return or refund" },
  { value: "damaged_item", label: "Damaged item" },
  { value: "wrong_item", label: "Wrong item received" },
  { value: "product_question", label: "Product question" },
  { value: "other", label: "Other" },
] as const

export type SupportTopicValue = (typeof SUPPORT_TOPICS)[number]["value"]
