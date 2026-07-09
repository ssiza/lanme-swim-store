import {
  createOrderAccessToken,
  verifyOrderAccessToken,
} from "../order-access"

describe("order access tokens", () => {
  const orderId = "order_01KW00EMMN91GA35XCHVC1W84W"
  const email = "customer@example.com"

  it("creates and verifies a token for the matching order and email", () => {
    const token = createOrderAccessToken(orderId, email)
    const verified = verifyOrderAccessToken(orderId, token)

    expect(verified?.email).toBe(email.toLowerCase())
  })

  it("rejects tokens for a different order id", () => {
    const token = createOrderAccessToken(orderId, email)
    const verified = verifyOrderAccessToken("order_other", token)

    expect(verified).toBeNull()
  })
})
