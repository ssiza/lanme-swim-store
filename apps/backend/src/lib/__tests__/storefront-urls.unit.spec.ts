import {
  buildAdminInviteUrl,
  deriveApiOriginFromStorefront,
  getAdminBaseUrl,
  isStorefrontOrMarketingOrigin,
} from "../storefront-urls"

describe("admin invite base URL", () => {
  const env = { ...process.env }

  afterEach(() => {
    process.env = { ...env }
  })

  it("treats apex lanmeswim.com as marketing when storefront is store.*", () => {
    expect(
      isStorefrontOrMarketingOrigin(
        "https://lanmeswim.com",
        "https://store.lanmeswim.com"
      )
    ).toBe(true)
    expect(
      isStorefrontOrMarketingOrigin(
        "https://api.lanmeswim.com",
        "https://store.lanmeswim.com"
      )
    ).toBe(false)
  })

  it("derives api.<root> from store.<root> storefront", () => {
    expect(deriveApiOriginFromStorefront("https://store.lanmeswim.com")).toBe(
      "https://api.lanmeswim.com"
    )
    expect(deriveApiOriginFromStorefront("https://lanmeswim.com")).toBe(
      "https://api.lanmeswim.com"
    )
  })

  it("does not use storefront apex as invite host", () => {
    process.env.MEDUSA_ADMIN_URL = ""
    process.env.MEDUSA_BACKEND_URL = "https://lanmeswim.com"
    process.env.STOREFRONT_URL = "https://store.lanmeswim.com"
    process.env.ADMIN_CORS = ""

    expect(getAdminBaseUrl()).toBe("https://api.lanmeswim.com")
    expect(buildAdminInviteUrl("tok")).toBe(
      "https://api.lanmeswim.com/app/invite?token=tok"
    )
  })

  it("prefers MEDUSA_ADMIN_URL when set", () => {
    process.env.MEDUSA_ADMIN_URL = "https://api.lanmeswim.com"
    process.env.MEDUSA_BACKEND_URL = "https://lanmeswim.com"
    process.env.STOREFRONT_URL = "https://store.lanmeswim.com"

    expect(getAdminBaseUrl()).toBe("https://api.lanmeswim.com")
  })

  it("keeps a correct MEDUSA_BACKEND_URL", () => {
    process.env.MEDUSA_ADMIN_URL = ""
    process.env.MEDUSA_BACKEND_URL = "https://api.lanmeswim.com"
    process.env.STOREFRONT_URL = "https://store.lanmeswim.com"

    expect(getAdminBaseUrl()).toBe("https://api.lanmeswim.com")
  })
})
