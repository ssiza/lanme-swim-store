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

export type VerificationEmailProps = {
  email?: string
  verification_url?: string
  expires_at?: string
}

export const verificationEmail = ({
  email,
  verification_url,
  expires_at,
}: VerificationEmailProps) => {
  const expiryText = expires_at
    ? new Date(expires_at).toLocaleString("en", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null

  return (
    <Html>
      <Head />
      <Preview>Verify your Lanmè Swim account</Preview>
      <Body style={main}>
        <Section style={container}>
          <Heading style={heading}>Lanmè Swim</Heading>
          <Text style={paragraph}>
            Verify your email address{email ? ` (${email})` : ""} to finish
            setting up your account.
          </Text>

          {verification_url && (
            <Section>
              <Link href={verification_url} style={button}>
                Verify email
              </Link>
            </Section>
          )}

          {verification_url && (
            <Text style={fallback}>
              If the button does not work, copy this link into your browser:
              <br />
              <Link href={verification_url}>{verification_url}</Link>
            </Text>
          )}

          {expiryText && (
            <Text style={muted}>This link expires on {expiryText}.</Text>
          )}
        </Section>
      </Body>
    </Html>
  )
}

export default verificationEmail

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
  margin: "0 0 16px",
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

const muted = {
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "16px 0 0",
}
