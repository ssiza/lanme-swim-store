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

const normalizeOrigin = (value?: string | null): string => {
  if (!value) {
    return ""
  }
  const trimmed = value.trim().replace(/\/$/, "")
  if (!trimmed || trimmed === "/") {
    return ""
  }
  return trimmed
}

const tryParseUrl = (value: string): URL | null => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

const hostWithoutWww = (hostname: string) => hostname.replace(/^www\./i, "")

/**
 * True when `candidate` is the storefront origin or the marketing apex for the
 * same brand (e.g. https://lanmeswim.com when storefront is store.lanmeswim.com).
 * Those hosts do not serve Medusa Admin `/app/*`.
 */
export const isStorefrontOrMarketingOrigin = (
  candidate: string,
  storefront: string
): boolean => {
  const candidateUrl = tryParseUrl(candidate)
  if (!candidateUrl) {
    return true
  }

  const storefrontUrl = tryParseUrl(storefront)
  if (!storefrontUrl) {
    return false
  }

  const candidateHost = hostWithoutWww(candidateUrl.hostname)
  const storefrontHost = hostWithoutWww(storefrontUrl.hostname)

  if (candidateHost === storefrontHost) {
    return true
  }

  if (
    storefrontHost.startsWith("store.") &&
    candidateHost === storefrontHost.slice("store.".length)
  ) {
    return true
  }

  return false
}

/** Prefer api.<root> when the storefront is store.<root> or the apex host. */
export const deriveApiOriginFromStorefront = (storefront: string): string => {
  const storefrontUrl = tryParseUrl(storefront)
  if (!storefrontUrl) {
    return ""
  }

  const host = hostWithoutWww(storefrontUrl.hostname)
  const root = host.startsWith("store.") ? host.slice("store.".length) : host
  if (!root || root.includes("localhost")) {
    return ""
  }

  return `${storefrontUrl.protocol}//api.${root}`
}

/**
 * Public origin that serves Medusa Admin (`/app`).
 *
 * Invite emails must not use the storefront/marketing site — that yields
 * `/us/app/invite` 404s. Prefer MEDUSA_ADMIN_URL, then a backend URL that is
 * not the storefront, then api.<domain> derived from STOREFRONT_URL, then
 * ADMIN_CORS, then localhost.
 */
export const getAdminBaseUrl = (): string => {
  const storefront = normalizeOrigin(process.env.STOREFRONT_URL)
  const explicitAdmin = normalizeOrigin(process.env.MEDUSA_ADMIN_URL)
  if (explicitAdmin && tryParseUrl(explicitAdmin)) {
    return explicitAdmin
  }

  const backend = normalizeOrigin(process.env.MEDUSA_BACKEND_URL)
  const backendIsUsable =
    Boolean(backend) &&
    Boolean(tryParseUrl(backend)) &&
    (!storefront || !isStorefrontOrMarketingOrigin(backend, storefront))

  if (backendIsUsable) {
    return backend
  }

  const derived = deriveApiOriginFromStorefront(storefront)
  if (derived) {
    return derived
  }

  for (const part of (process.env.ADMIN_CORS || "").split(",")) {
    const origin = normalizeOrigin(part)
    if (
      origin &&
      tryParseUrl(origin) &&
      (!storefront || !isStorefrontOrMarketingOrigin(origin, storefront))
    ) {
      return origin
    }
  }

  return "http://localhost:9000"
}

export const buildAdminCustomerServiceTicketUrl = (ticketId: string) => {
  return `${getAdminBaseUrl()}/app/customer-service/${ticketId}`
}

/** Admin invite acceptance URL (Medusa Admin hosts `/app/invite`). */
export const buildAdminInviteUrl = (token: string) => {
  return `${getAdminBaseUrl()}/app/invite?token=${encodeURIComponent(token)}`
}
