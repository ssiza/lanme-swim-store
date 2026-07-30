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

export type UserInvitedEmailProps = {
  email?: string
  invite_url?: string
}

export const userInvitedEmail = ({
  email,
  invite_url,
}: UserInvitedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>You're invited to the Lanmè Swim admin</Preview>
      <Body style={main}>
        <Section style={container}>
          <Heading style={heading}>Lanmè Swim</Heading>
          <Text style={paragraph}>
            Hello{email ? ` ${email}` : ""},
          </Text>
          <Text style={paragraph}>
            You&apos;ve been invited to join the Lanmè Swim admin. Click the
            button below to accept the invitation and create your account.
          </Text>

          {invite_url && (
            <Section>
              <Link href={invite_url} style={button}>
                Accept invitation
              </Link>
            </Section>
          )}

          {invite_url && (
            <Text style={fallback}>
              If the button does not work, copy this link into your browser:
              <br />
              <Link href={invite_url}>{invite_url}</Link>
            </Text>
          )}

          <Text style={muted}>
            If you weren&apos;t expecting this invitation, you can ignore this
            email.
          </Text>
        </Section>
      </Body>
    </Html>
  )
}

export default userInvitedEmail

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

const muted = {
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "20px 0 0",
}
