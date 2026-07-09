"use client"

import { resetCustomerPassword } from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { Button } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useSearchParams } from "next/navigation"
import { useActionState } from "react"

const ResetPassword = () => {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")
  const [message, formAction] = useActionState(resetCustomerPassword, null)

  if (!token) {
    return (
      <div
        className="max-w-sm w-full flex flex-col items-center text-center gap-y-4"
        data-testid="reset-password-page"
      >
        <h1 className="text-large-semi uppercase">Reset your password</h1>
        <p className="text-base-regular text-ui-fg-base">
          This reset link is invalid or has expired. Request a new password
          reset email and try again.
        </p>
        <LocalizedClientLink href="/account">
          <Button variant="secondary">Go to sign in</Button>
        </LocalizedClientLink>
      </div>
    )
  }

  if (message?.state === "success") {
    return (
      <div
        className="max-w-sm w-full flex flex-col items-center text-center gap-y-4"
        data-testid="reset-password-success"
      >
        <h1 className="text-large-semi uppercase">Reset your password</h1>
        <p className="text-base-regular text-ui-fg-base">
          Your password has been updated. You can now sign in.
        </p>
        <LocalizedClientLink href="/account">
          <Button variant="primary">Go to sign in</Button>
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="reset-password-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Reset your password</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Enter a new password for your Lanmè Swim account
        {email ? ` (${email})` : ""}.
      </p>
      <form className="w-full" action={formAction}>
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            data-testid="new-password-input"
          />
          <Input
            label="Confirm password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            data-testid="confirm-password-input"
          />
        </div>
        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="reset-password-error-message"
        />
        <SubmitButton data-testid="update-password-button" className="w-full mt-6">
          Update password
        </SubmitButton>
      </form>
    </div>
  )
}

export default ResetPassword
