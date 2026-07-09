import {
  buildOrderEmailTotals,
  formatOrderMoney,
  normalizeMoneyAmount,
  resolveOrderHeadlineTotal,
} from "../order-email-money"

describe("order email money helpers", () => {
  const sampleOrder = {
    total: 27.97,
    item_subtotal: 18.99,
    shipping_total: 8.99,
    tax_total: 0,
    summary: {
      current_order_total: 27.97,
    },
    items: [
      {
        title: "Fanarc Tee",
        quantity: 1,
        unit_price: 18.99,
      },
    ],
  }

  it("normalizes BigNumber-like values", () => {
    expect(normalizeMoneyAmount({ numeric: 27.97 })).toBe(27.97)
    expect(normalizeMoneyAmount("8.99")).toBe(8.99)
  })

  it("prefers summary.current_order_total for the headline total", () => {
    expect(
      resolveOrderHeadlineTotal({
        total: 8.99,
        summary: { current_order_total: 27.97 },
      })
    ).toBe(27.97)
  })

  it("falls back to computed totals when order.total matches shipping only", () => {
    expect(
      resolveOrderHeadlineTotal({
        total: 8.99,
        item_subtotal: 18.98,
        shipping_total: 8.99,
        tax_total: 0,
      })
    ).toBeCloseTo(27.97, 2)
  })

  it("uses corrected totals when order.total only reflects shipping", () => {
    const totals = buildOrderEmailTotals({
      total: 8.99,
      item_subtotal: 18.98,
      shipping_total: 8.99,
      tax_total: 0,
      items: [],
    })

    expect(totals.headline_total).toBeCloseTo(27.97, 2)
    expect(totals.total).toBeCloseTo(27.97, 2)
    expect(totals.shipping_total).toBe(8.99)
    expect(totals.item_subtotal).toBe(18.98)
  })

  it("maps order monetary fields for the confirmation email", () => {
    const totals = buildOrderEmailTotals(sampleOrder)

    expect(totals.headline_total).toBe(27.97)
    expect(totals.item_subtotal).toBe(18.99)
    expect(totals.shipping_total).toBe(8.99)
    expect(totals.tax_total).toBe(0)
    expect(totals.total).toBe(27.97)
    expect(totals.items).toEqual([
      {
        title: "Fanarc Tee",
        quantity: 1,
        unit_price: 18.99,
      },
    ])
  })

  it("formats headline and summary lines independently", () => {
    const totals = buildOrderEmailTotals(sampleOrder)

    expect(formatOrderMoney(totals.headline_total, "usd")).toBe("$27.97")
    expect(formatOrderMoney(totals.shipping_total, "usd")).toBe("$8.99")
    expect(formatOrderMoney(totals.item_subtotal, "usd")).toBe("$18.99")
    expect(formatOrderMoney(totals.total, "usd")).toBe("$27.97")
  })
})
