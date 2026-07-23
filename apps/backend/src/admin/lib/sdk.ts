import Lanme Swim from "@medusajs/js-sdk"

export const sdk = new Lanme Swim({
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
  debug: import.meta.env.DEV,
  auth: {
    type: "session",
  },
})
