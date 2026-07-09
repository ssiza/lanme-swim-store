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

export type SupportTicketAdminNotificationEmailProps = {
  name?: string
  email?: string
  topic_label?: string
  message?: string
  order_number?: string | null
  ticket_id?: string
  admin_url?: string
}

export const supportTicketAdminNotificationEmail = ({
  name,
  email,
  topic_label,
  message,
  order_number,
  ticket_id,
  admin_url,
}: SupportTicketAdminNotificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New Lanmè Swim customer service request</Preview>
      <Body style={main}>
        <Section style={container}>
          <Heading style={heading}>New support request</Heading>
          <Text style={paragraph}>
            {name || "A customer"} submitted a support request.
          </Text>
          {ticket_id && <Text style={paragraph}>Ticket: {ticket_id}</Text>}
          {email && <Text style={paragraph}>Email: {email}</Text>}
          {topic_label && <Text style={paragraph}>Topic: {topic_label}</Text>}
          {order_number && (
            <Text style={paragraph}>Order number: {order_number}</Text>
          )}
          {message && <Text style={messageBox}>{message}</Text>}
          {admin_url && (
            <Text style={paragraph}>
              <Link href={admin_url}>Open ticket in admin</Link>
            </Text>
          )}
        </Section>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f6f6f6",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "560px",
  backgroundColor: "#ffffff",
}

const heading = {
  fontSize: "24px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#111111",
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#333333",
}

const messageBox = {
  ...paragraph,
  backgroundColor: "#f3f4f6",
  padding: "16px",
  borderRadius: "8px",
  whiteSpace: "pre-wrap",
}
