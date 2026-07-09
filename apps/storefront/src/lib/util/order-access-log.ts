type OrderAccessLogPayload = {
  order_id: string
  route: string
  auth_state: "authenticated" | "guest"
  order_exists?: boolean | "unknown"
  customer_owns_order?: boolean
  render_state:
    | "full"
    | "sign_in"
    | "verify"
    | "not_found"
    | "wrong_account"
}

export function logOrderAccess(payload: OrderAccessLogPayload) {
  console.log(
    JSON.stringify({
      event: "storefront.order_access",
      ...payload,
    })
  )
}
