/**
 * Default storefront country segment when env and geo lookup do not resolve.
 * Seed data ships a Europe region (gb/de/dk/se/fr/es/it) — prefer `gb` over `us`
 * so checkout shipping options resolve out of the box.
 */
export const DEFAULT_COUNTRY_CODE = "gb"

export const getDefaultCountryCode = () =>
  process.env.NEXT_PUBLIC_DEFAULT_REGION?.toLowerCase() ||
  DEFAULT_COUNTRY_CODE
