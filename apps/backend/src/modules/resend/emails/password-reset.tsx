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

export type PasswordResetEmailProps = {
  email?: string
  reset_url?: string
}

export const passwordResetEmail = ({
  email,
  reset_url,
}: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your Lanmè Swim password</Preview>
      <Body style={main}>
        <Section style={container}>
          <Heading style={heading}>Lanmè Swim</Heading>
          <Text style={paragraph}>
            We received a request to reset the password
            {email ? ` for ${email}` : ""}.
          </Text>
          <Text style={paragraph}>
            If you made this request, use the button below. If not, you can
            ignore this email.
          </Text>

          {reset_url && (
            <Section>
              <Link href={reset_url} style={button}>
                Reset password
              </Link>
            </Section>
          )}

          {reset_url && (
            <Text style={fallback}>
              If the button does not work, copy this link into your browser:
              <br />
              <Link href={reset_url}>{reset_url}</Link>
            </Text>
          )}
        </Section>
      </Body>
    </Html>
  )
}

export default passwordResetEmail

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
  margin: "20px 0 0",
  wordBreak: "break-all" as const,
}
