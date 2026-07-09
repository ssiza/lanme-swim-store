// @ts-nocheck
import {
  Body,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import {
  formatOrderMoney,
  type OrderEmailLineItem,
} from "../../../lib/order-email-money"
import * as React from "react"

export type OrderPlacedLineItem = OrderEmailLineItem

export type OrderPlacedEmailProps = {
  display_id?: number | string | null
  order_id?: string
  email?: string | null
  currency_code?: string
  headline_total?: number | null
  item_subtotal?: number | null
  shipping_total?: number | null
  tax_total?: number | null
  total?: number | null
  items?: OrderPlacedLineItem[]
  order_url?: string
  account_url?: string
}

export const orderPlacedEmail = ({
  display_id,
  order_id,
  email,
  currency_code,
  headline_total,
  item_subtotal,
  shipping_total,
  tax_total,
  total,
  items = [],
  order_url,
  account_url,
}: OrderPlacedEmailProps) => {
  const orderLabel = display_id ? `#${display_id}` : order_id || "your order"
  const resolvedHeadlineTotal =
    headline_total != null ? headline_total : total ?? null

  return (
    <Html>
      <Head />
      <Preview>Your Lanmè Swim order {orderLabel} is confirmed</Preview>
      <Body style={main}>
        <Section style={container}>
          <Heading style={heading}>Lanmè Swim</Heading>
          <Text style={paragraph}>Thanks for your order, {email || "there"}.</Text>
          <Text style={paragraph}>
            We received Order {orderLabel}
            {resolvedHeadlineTotal != null
              ? ` totaling ${formatOrderMoney(resolvedHeadlineTotal, currency_code)}`
              : ""}
            .
          </Text>

          {items.length > 0 && (
            <Section style={itemsBox}>
              <Text style={subheading}>Items</Text>
              {items.map((item, index) => (
                <Text key={`${item.title}-${index}`} style={itemLine}>
                  {item.title || "Item"}
                  {" · "}
                  Qty {item.quantity ?? 1}
                  {item.unit_price != null
                    ? ` · ${formatOrderMoney(item.unit_price, currency_code)} each`
                    : ""}
                </Text>
              ))}
            </Section>
          )}

          {(item_subtotal != null ||
            shipping_total != null ||
            tax_total != null ||
            total != null) && (
            <Section style={itemsBox}>
              <Text style={subheading}>Order summary</Text>
              {item_subtotal != null && (
                <Text style={summaryLine}>
                  <span>Subtotal</span>
                  <span style={summaryAmount}>
                    {formatOrderMoney(item_subtotal, currency_code)}
                  </span>
                </Text>
              )}
              {shipping_total != null && (
                <Text style={summaryLine}>
                  <span>Shipping</span>
                  <span style={summaryAmount}>
                    {formatOrderMoney(shipping_total, currency_code)}
                  </span>
                </Text>
              )}
              {tax_total != null && (
                <Text style={summaryLine}>
                  <span>Tax</span>
                  <span style={summaryAmount}>
                    {formatOrderMoney(tax_total, currency_code)}
                  </span>
                </Text>
              )}
              {total != null && (
                <Text style={summaryTotalLine}>
                  <span>Total</span>
                  <span style={summaryAmount}>
                    {formatOrderMoney(total, currency_code)}
                  </span>
                </Text>
              )}
            </Section>
          )}

          {order_url && (
            <Section>
              <Link href={order_url} style={button}>
                View order
              </Link>
            </Section>
          )}

          {account_url && (
            <Text style={fallback}>
              Or open your account:{" "}
              <Link href={account_url}>{account_url}</Link>
            </Text>
          )}

          <Text style={footer}>
            Questions? Reply to this email and our team will help.
          </Text>
        </Section>
      </Body>
    </Html>
  )
}

export default orderPlacedEmail

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "32px",
  maxWidth: "560px",
  borderRadius: "8px",
}

const heading = {
  color: "#18181b",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0 0 16px",
}

const subheading = {
  color: "#18181b",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
}

const paragraph = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 12px",
}

const itemsBox = {
  margin: "20px 0",
  padding: "16px",
  backgroundColor: "#fafafa",
  borderRadius: "6px",
}

const itemLine = {
  color: "#3f3f46",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 6px",
}

const summaryLine = {
  color: "#3f3f46",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 6px",
  display: "flex",
  justifyContent: "space-between",
}

const summaryTotalLine = {
  ...summaryLine,
  color: "#18181b",
  fontWeight: "600",
  marginTop: "8px",
  paddingTop: "8px",
  borderTop: "1px solid #e4e4e7",
}

const summaryAmount = {
  textAlign: "right" as const,
}

const button = {
  backgroundColor: "#18181b",
  color: "#ffffff",
  padding: "12px 20px",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "600",
  display: "inline-block",
}

const fallback = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "16px 0 0",
  wordBreak: "break-all" as const,
}

const footer = {
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "24px 0 0",
}
