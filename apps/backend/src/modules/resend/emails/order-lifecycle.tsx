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
import * as React from "react"

export type OrderLifecycleEmailProps = {
  display_id?: number | string | null
  order_id?: string
  email?: string | null
  order_url?: string
  account_url?: string
  tracking_number?: string | null
  tracking_url?: string | null
}

const orderLabel = (display_id?: number | string | null, order_id?: string) =>
  display_id ? `#${display_id}` : order_id || "your order"

export const orderFulfillmentPreparingEmail = ({
  display_id,
  order_id,
  email,
  order_url,
  account_url,
}: OrderLifecycleEmailProps) => {
  const label = orderLabel(display_id, order_id)

  return (
    <Html>
      <Head />
      <Preview>Your Lanmè Swim order {label} is being prepared</Preview>
      <Body style={main}>
        <Section style={container}>
          <Heading style={heading}>Lanmè Swim</Heading>
          <Text style={paragraph}>
            Hi {email || "there"}, we are preparing your order {label}.
          </Text>
          <Text style={paragraph}>
            We will email you again when it ships.
          </Text>
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
        </Section>
      </Body>
    </Html>
  )
}

export const orderShippedEmail = ({
  display_id,
  order_id,
  email,
  order_url,
  account_url,
  tracking_number,
  tracking_url,
}: OrderLifecycleEmailProps) => {
  const label = orderLabel(display_id, order_id)

  return (
    <Html>
      <Head />
      <Preview>Your Lanmè Swim order {label} has shipped</Preview>
      <Body style={main}>
        <Section style={container}>
          <Heading style={heading}>Lanmè Swim</Heading>
          <Text style={paragraph}>
            Hi {email || "there"}, your order {label} is on its way.
          </Text>
          {tracking_number && (
            <Text style={paragraph}>Tracking number: {tracking_number}</Text>
          )}
          {tracking_url && (
            <Section>
              <Link href={tracking_url} style={button}>
                Track shipment
              </Link>
            </Section>
          )}
          {order_url && (
            <Text style={fallback}>
              View order details: <Link href={order_url}>{order_url}</Link>
            </Text>
          )}
          {account_url && (
            <Text style={fallback}>
              Or open your account:{" "}
              <Link href={account_url}>{account_url}</Link>
            </Text>
          )}
        </Section>
      </Body>
    </Html>
  )
}

export const orderDeliveredEmail = ({
  display_id,
  order_id,
  email,
  order_url,
  account_url,
}: OrderLifecycleEmailProps) => {
  const label = orderLabel(display_id, order_id)

  return (
    <Html>
      <Head />
      <Preview>Your Lanmè Swim order {label} was delivered</Preview>
      <Body style={main}>
        <Section style={container}>
          <Heading style={heading}>Lanmè Swim</Heading>
          <Text style={paragraph}>
            Hi {email || "there"}, your order {label} was delivered.
          </Text>
          <Text style={paragraph}>
            If anything is wrong with your order, reply to this email and we
            will help.
          </Text>
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
        </Section>
      </Body>
    </Html>
  )
}

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

const paragraph = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 12px",
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
