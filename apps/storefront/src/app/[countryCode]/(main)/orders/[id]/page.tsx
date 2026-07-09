import { resolveOrderAccess } from "@lib/data/order-access"
import { logPageRender } from "@lib/util/storefront-fetch-log"
import OrderDetailsTemplate from "@modules/order/templates/order-details-template"
import OrderLookupGate from "@modules/order/components/order-lookup-gate"
import OrderNotFound from "@modules/order/components/order-not-found"
import { Metadata } from "next"

type Props = {
  params: Promise<{ countryCode: string; id: string }>
  searchParams: Promise<{ status?: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const result = await resolveOrderAccess(params.id, params.countryCode)

  if (result.state === "full") {
    return {
      title: `Order #${result.order.display_id}`,
      description: "View your order",
    }
  }

  return {
    title: "View your order",
    description: "Look up your Lanmè Swim order",
  }
}

export default async function OrderLookupPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const result = await resolveOrderAccess(params.id, params.countryCode)

  logPageRender(`/${params.countryCode}/orders/${params.id}`, {
    render_state: result.state,
    order_id: params.id,
  })

  if (searchParams.status === "not_found" || result.state === "not_found") {
    return <OrderNotFound orderId={params.id} />
  }

  if (result.state === "full") {
    return (
      <div className="content-container py-10">
        <OrderDetailsTemplate order={result.order} />
      </div>
    )
  }

  if (result.state === "wrong_account") {
    return (
      <OrderLookupGate
        orderId={params.id}
        countryCode={params.countryCode}
        variant="wrong_account"
      />
    )
  }

  return (
    <OrderLookupGate
      orderId={params.id}
      countryCode={params.countryCode}
      variant={result.state === "sign_in" ? "sign_in" : "verify"}
    />
  )
}
