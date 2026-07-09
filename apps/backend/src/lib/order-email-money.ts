export type OrderMoneyInput = number | string | { numeric?: number } | null | undefined

export type OrderEmailLineItem = {
  title?: string | null
  quantity?: number | null
  unit_price?: number | null
}

export type OrderEmailTotals = {
  headline_total: number
  item_subtotal: number
  shipping_total: number
  tax_total: number
  total: number
  items: OrderEmailLineItem[]
}

type OrderGraphRecord = {
  currency_code?: string
  total?: OrderMoneyInput
  item_subtotal?: OrderMoneyInput
  shipping_total?: OrderMoneyInput
  tax_total?: OrderMoneyInput
  summary?: {
    current_order_total?: OrderMoneyInput
  } | null
  items?: Array<{
    title?: string | null
    quantity?: number | null
    unit_price?: OrderMoneyInput
  }> | null
}

export const normalizeMoneyAmount = (value: OrderMoneyInput): number => {
  if (value === null || value === undefined || value === "") {
    return 0
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === "string") {
    const parsed = parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (typeof value === "object" && typeof value.numeric === "number") {
    return Number.isFinite(value.numeric) ? value.numeric : 0
  }

  if (
    typeof value === "object" &&
    typeof (value as { valueOf?: () => unknown }).valueOf === "function"
  ) {
    const coerced = Number((value as { valueOf: () => unknown }).valueOf())
    return Number.isFinite(coerced) ? coerced : 0
  }

  return 0
}

export const resolveOrderHeadlineTotal = (order: OrderGraphRecord): number => {
  const summaryTotal = normalizeMoneyAmount(order.summary?.current_order_total)
  const orderTotal = normalizeMoneyAmount(order.total)
  const itemSubtotal = normalizeMoneyAmount(order.item_subtotal)
  const shippingTotal = normalizeMoneyAmount(order.shipping_total)
  const taxTotal = normalizeMoneyAmount(order.tax_total)
  const computedTotal = itemSubtotal + shippingTotal + taxTotal

  if (summaryTotal > 0) {
    return summaryTotal
  }

  if (
    orderTotal > 0 &&
    (orderTotal !== shippingTotal || computedTotal <= orderTotal)
  ) {
    return orderTotal
  }

  if (computedTotal > 0) {
    return computedTotal
  }

  return orderTotal
}

export const buildOrderEmailTotals = (
  order: OrderGraphRecord
): OrderEmailTotals => {
  const headline_total = resolveOrderHeadlineTotal(order)
  const item_subtotal = normalizeMoneyAmount(order.item_subtotal)
  const shipping_total = normalizeMoneyAmount(order.shipping_total)
  const tax_total = normalizeMoneyAmount(order.tax_total)
  const orderTotal = normalizeMoneyAmount(order.total)
  const total =
    orderTotal > 0 && orderTotal !== headline_total && orderTotal > shipping_total
      ? orderTotal
      : headline_total

  const items =
    order.items?.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      unit_price: normalizeMoneyAmount(item.unit_price),
    })) ?? []

  return {
    headline_total,
    item_subtotal,
    shipping_total,
    tax_total,
    total,
    items,
  }
}

export const formatOrderMoney = (
  amount: number | null | undefined,
  currencyCode?: string
) => {
  if (amount === null || amount === undefined) {
    return ""
  }

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currencyCode || "USD",
    }).format(amount)
  } catch {
    return amount.toFixed(2)
  }
}
