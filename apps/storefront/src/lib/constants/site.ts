export const SITE_NAME = "Lanmè Swim"
export const SITE_DESCRIPTION =
  "Bikinis, one-pieces, and beach essentials designed for sun, sand, and swim."
export const SITE_TAGLINE = "Enjoy the sun, sand, and swim."
export const SITE_COPYRIGHT = `© ${new Date().getFullYear()} Lanmè Swim. All rights reserved.`
export const LOGO_SRC = "/lanme-logo.svg"

/** Shared shopper-facing labels, keeping nav, bag, and CTAs consistent. */
export const SITE_COPY = {
  shop: "Shop",
  shopSwim: "Shop swim",
  shopAll: "Shop all swimwear",
  collections: "Collections",
  account: "Account",
  bag: "Bag",
  bagEmptyTitle: "Your bag is empty",
  bagEmptyBody:
    "Find your next bikini, one-piece, or beach essential and add it here.",
  shopSwimwear: "Shop swimwear",
  shopTheEdit: "Shop the edit",
  exploreCollections: "Explore collections",
  continueShopping: "Continue shopping",
  emptyCatalogTitle: "New pieces are on the way",
  emptyCatalogBody: "Check back soon for the latest Lanmè Swim styles.",
  emptyCollectionTitle: "Nothing in this edit yet",
  emptyCollectionBody: "New styles for this collection will appear here soon.",
  emptyCategoryTitle: "Nothing in this category yet",
  emptyCategoryBody: "New styles for this category will appear here soon.",
  collectionsIntro:
    "Shop by edit for bikinis, one-pieces, and beach essentials.",
  signInTitle: "Welcome back",
  signInBody: "Sign in to track orders and manage your addresses.",
  createAccountTitle: "Create your account",
  createAccountBody:
    "Save addresses, track orders, and check out faster next time.",
  noOrdersTitle: "No orders yet",
  noOrdersBody: "When you place an order, it will show up here.",
  notFoundTitle: "Page not found",
  notFoundBody: "That page doesn’t exist. Let’s get you back to shopping.",
  backHome: "Back to Lanmè Swim",
} as const

export const SITE_FOOTER_ABOUT =
  "Lanmè Swim brings sunlit swimwear and beach essentials with a Caribbean-inspired feel, made for easy days by the water."

export const SITE_SUPPORT_LINKS = [
  { label: "Customer service", href: "/customer-service" },
  { label: "Order help", href: "/customer-service" },
  { label: "Returns and exchanges", href: "/customer-service" },
  { label: "Account support", href: "/account" },
] as const

export const SITE_ABOUT_LINKS = [
  { label: "Our swim shop", href: "/" },
  { label: "All swimwear", href: "/store" },
  { label: "Collections", href: "/collections" },
] as const
