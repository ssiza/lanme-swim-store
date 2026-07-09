"use client"

import { submitCustomerServiceRequest } from "@lib/data/customer-service"
import { SUPPORT_TOPICS } from "@lib/constants/customer-service-topics"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import { Label } from "@modules/common/components/ui"
import { useActionState } from "react"

const CustomerServiceForm = () => {
  const [message, formAction] = useActionState(
    submitCustomerServiceRequest,
    null
  )

  if (message?.state === "success") {
    return (
      <div
        className="w-full max-w-xl text-center text-base-regular text-ui-fg-base bg-ui-bg-subtle border border-ui-border-base rounded-rounded p-8"
        data-testid="customer-service-success"
      >
        Your request has been sent. We&apos;ll reply by email.
      </div>
    )
  }

  return (
    <form
      className="w-full max-w-xl flex flex-col gap-y-4"
      action={formAction}
      data-testid="customer-service-form"
    >
      <Input
        label="Full name"
        name="name"
        required
        autoComplete="name"
        data-testid="customer-service-name"
      />
      <Input
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        data-testid="customer-service-email"
      />
      <Input
        label="Order number (optional)"
        name="order_number"
        autoComplete="off"
        data-testid="customer-service-order-number"
      />
      <div className="flex flex-col gap-y-2">
        <Label>Topic</Label>
        <NativeSelect
          name="topic"
          required
          data-testid="customer-service-topic"
        >
          {SUPPORT_TOPICS.map((topic) => (
            <option key={topic.value} value={topic.value}>
              {topic.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-y-2">
        <Label htmlFor="customer-service-message">Message</Label>
        <textarea
          id="customer-service-message"
          name="message"
          required
          rows={6}
          className="w-full rounded-md border border-ui-border-base bg-ui-bg-subtle px-4 py-2.5 text-base-regular outline-none transition-colors hover:bg-ui-bg-field-hover focus:bg-ui-bg-field"
          data-testid="customer-service-message"
        />
      </div>
      <ErrorMessage
        error={message?.state === "error" ? message.error : null}
        data-testid="customer-service-error"
      />
      <SubmitButton data-testid="customer-service-submit">
        Submit
      </SubmitButton>
    </form>
  )
}

export default CustomerServiceForm
