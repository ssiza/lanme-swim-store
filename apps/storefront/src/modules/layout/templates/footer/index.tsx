import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { getHomepageSettings } from "@lib/data/homepage"
import { SITE_COPYRIGHT } from "@lib/constants/site"
import { getCategoryPath } from "@lib/util/category-path"
import { Text, clx } from "@modules/common/components/ui"
import SiteLogo from "@modules/common/components/site-logo"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { ReactNode } from "react"

function FooterLinkItem({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  const isExternal = /^https?:\/\//i.test(href)

  if (isExternal) {
    return (
      <a
        href={href}
        className="hover:text-ui-fg-base"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  }

  return (
    <LocalizedClientLink className="hover:text-ui-fg-base" href={href}>
      {children}
    </LocalizedClientLink>
  )
}

export default async function Footer() {
  const [{ collections }, productCategories, settings] = await Promise.all([
    listCollections({
      fields: "id, handle, title, *products",
    }),
    listCategories(),
    getHomepageSettings(),
  ])

  const collectionsWithProducts =
    collections?.filter((collection) => (collection.products?.length ?? 0) > 0) ??
    []

  const about = settings.footer_about
  const address = settings.footer_address
  const moreLinks = settings.footer_links ?? []
  const addressLines = address
    ? address.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    : []

  return (
    <footer className="border-t border-ui-border-base w-full">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-10 xsmall:flex-row xsmall:items-start xsmall:justify-between py-40">
          <div className="flex max-w-sm flex-col gap-y-4">
            <LocalizedClientLink
              href="/"
              className="inline-block w-fit hover:opacity-90 transition-opacity"
            >
              <SiteLogo height={28} />
            </LocalizedClientLink>

            {about && (
              <Text className="txt-small text-ui-fg-subtle whitespace-pre-line">
                {about}
              </Text>
            )}

            {addressLines.length > 0 && (
              <address className="not-italic txt-small text-ui-fg-subtle">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            )}
          </div>

          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {productCategories && productCategories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">
                  Categories
                </span>
                <ul
                  className="grid grid-cols-1 gap-2"
                  data-testid="footer-categories"
                >
                  {productCategories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return
                    }

                    const children =
                      c.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null

                    return (
                      <li
                        className="flex flex-col gap-2 text-ui-fg-subtle txt-small"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className={clx(
                            "hover:text-ui-fg-base",
                            children && "txt-small-plus"
                          )}
                          href={`/categories/${getCategoryPath(c)}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 ml-3 gap-2">
                            {children.map((child) => (
                              <li key={child.id}>
                                <LocalizedClientLink
                                  className="hover:text-ui-fg-base"
                                  href={`/categories/${c.handle}/${child.handle}`}
                                  data-testid="category-link"
                                >
                                  {child.name}
                                </LocalizedClientLink>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
            {collectionsWithProducts.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">
                  Collections
                </span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small",
                    {
                      "grid-cols-2": collectionsWithProducts.length > 3,
                    }
                  )}
                >
                  {collectionsWithProducts.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="hover:text-ui-fg-base"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus txt-ui-fg-base">Shop</span>
              <ul className="grid grid-cols-1 gap-y-2 text-ui-fg-subtle txt-small">
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href="/store"
                  >
                    Store
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href="/account"
                  >
                    Account
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-ui-fg-base"
                    href="/cart"
                  >
                    Cart
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
            {moreLinks.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base">More</span>
                <ul className="grid grid-cols-1 gap-y-2 text-ui-fg-subtle txt-small">
                  {moreLinks.map((link) => (
                    <li key={`${link.label}-${link.href}`}>
                      <FooterLinkItem href={link.href}>
                        {link.label}
                      </FooterLinkItem>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="flex w-full mb-16 justify-between text-ui-fg-muted">
          <Text className="txt-compact-small">{SITE_COPYRIGHT}</Text>
        </div>
      </div>
    </footer>
  )
}
