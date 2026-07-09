/** Default storefront country segment when env and geo lookup do not resolve. */
export const DEFAULT_COUNTRY_CODE = "us"

export const getDefaultCountryCode = () =>
  process.env.NEXT_PUBLIC_DEFAULT_REGION?.toLowerCase() ||
  DEFAULT_COUNTRY_CODE
