import { Metadata } from "next"

import CustomerServiceForm from "@modules/customer-service/components/customer-service-form"

export const metadata: Metadata = {
  title: "Customer Service",
  description: "Contact Lanmè Swim support for order help, returns, and product questions.",
}

export default function CustomerServicePage() {
  return (
    <div className="content-container flex flex-col items-center px-6 py-16">
      <div className="mb-10 max-w-xl text-center">
        <h1 className="text-3xl-semi mb-3">Customer Service</h1>
        <p className="text-base-regular text-ui-fg-subtle">
          Send us a message and our team will reply by email. You do not need an
          account to contact us.
        </p>
      </div>
      <CustomerServiceForm />
    </div>
  )
}
