const getStorefrontBaseUrl = () =>
  (process.env.STOREFRONT_URL || "http://localhost:8000").replace(/\/$/, "")

const getStoreDefaultRegion = () =>
  process.env.STORE_DEFAULT_REGION?.toLowerCase() || "gb"

export const buildVerifyAccountUrl = (code: string) => {
  const base = getStorefrontBaseUrl()
  const region = getStoreDefaultRegion()

  return `${base}/${region}/verify-account?token=${encodeURIComponent(code)}`
}

export const buildPasswordResetUrl = (token: string, email: string) => {
  const base = getStorefrontBaseUrl()
  const region = getStoreDefaultRegion()

  return `${base}/${region}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
}

export const buildAccountUrl = () => {
  const base = getStorefrontBaseUrl()
  const region = getStoreDefaultRegion()

  return `${base}/${region}/account`
}

export const buildOrderUrl = (orderId: string) => {
  const base = getStorefrontBaseUrl()
  const region = getStoreDefaultRegion()

  return `${base}/${region}/orders/${orderId}`
}

export const buildCustomerServiceUrl = () => {
  const base = getStorefrontBaseUrl()
  const region = getStoreDefaultRegion()

  return `${base}/${region}/customer-service`
}

const getBackendBaseUrl = () =>
  (process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")

export const buildAdminCustomerServiceTicketUrl = (ticketId: string) => {
  return `${getBackendBaseUrl()}/app/customer-service/${ticketId}`
}

/** Admin invite acceptance URL (Medusa Admin hosts `/app/invite`). */
export const buildAdminInviteUrl = (token: string) => {
  return `${getBackendBaseUrl()}/app/invite?token=${encodeURIComponent(token)}`
}
