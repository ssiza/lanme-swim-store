// @ts-nocheck
import {
  Body,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

export type SupportTicketReplyEmailProps = {
  name?: string
  email?: string
  topic_label?: string
  reply_message?: string
  ticket_id?: string
}

export const supportTicketReplyEmail = ({
  name,
  topic_label,
  reply_message,
  ticket_id,
}: SupportTicketReplyEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reply from Lanmè Swim support</Preview>
      <Body style={main}>
        <Section style={container}>
          <Heading style={heading}>Lanmè Swim Support</Heading>
          <Text style={paragraph}>
            Hi {name || "there"}, we replied to your support request
            {topic_label ? ` about ${topic_label}` : ""}.
          </Text>
          {ticket_id && (
            <Text style={paragraph}>Reference: {ticket_id}</Text>
          )}
          {reply_message && <Text style={messageBox}>{reply_message}</Text>}
          <Text style={paragraph}>
            Reply to this email if you need more help.
          </Text>
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
