import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { getHomepageSettings } from "@lib/data/homepage"
import {
  SITE_ABOUT_LINKS,
  SITE_COPY,
  SITE_COPYRIGHT,
  SITE_FOOTER_ABOUT,
  SITE_SUPPORT_LINKS,
} from "@lib/constants/site"
import { getCategoryPath } from "@lib/util/category-path"
import { Text, clx } from "@modules/common/components/ui"
import SiteLogo from "@modules/common/components/site-logo"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { ReactNode } from "react"

const footerLinkClassName = "font-semibold hover:text-ui-fg-base"

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
        className={footerLinkClassName}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  }

  return (
    <LocalizedClientLink className={footerLinkClassName} href={href}>
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
    collections?.filter(
      (collection) => (collection.products?.length ?? 0) > 0
    ) ?? []

  // Once admin has saved footer settings, CMS wins completely — no hardcoded
  // about blurb or link columns. Defaults only apply before first save.
  const cmsConfigured = settings.footer_configured
  const about = cmsConfigured
    ? settings.footer_about?.trim() || null
    : settings.footer_about?.trim() || SITE_FOOTER_ABOUT
  const address = settings.footer_address?.trim() || null
  const supportLinks = cmsConfigured
    ? settings.footer_support_links
    : settings.footer_support_links.length > 0
      ? settings.footer_support_links
      : [...SITE_SUPPORT_LINKS]
  const aboutLinks = cmsConfigured
    ? settings.footer_about_links
    : settings.footer_about_links.length > 0
      ? settings.footer_about_links
      : [...SITE_ABOUT_LINKS]
  const moreLinks = settings.footer_links ?? []

  const addressLines = address
    ? address
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    : []

  return (
    <footer className="w-full bg-gradient-to-b from-[#fff8eb] via-white to-white shadow-[0_-14px_36px_rgba(12,42,81,0.06)]">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-10 xsmall:flex-row xsmall:items-start xsmall:justify-between py-40">
          <div className="flex max-w-sm flex-col gap-y-5">
            <LocalizedClientLink
              href="/"
              className="inline-block w-fit hover:opacity-90 transition-opacity"
            >
              <SiteLogo height={40} />
            </LocalizedClientLink>

            {about ? (
              <Text className="txt-small text-brand-ink/75 whitespace-pre-line">
                {about}
              </Text>
            ) : null}

            {addressLines.length > 0 ? (
              <address className="not-italic txt-small text-brand-ink/70">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            ) : null}
          </div>

          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {productCategories && productCategories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-brand-ink">
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
                        className="flex flex-col gap-2 text-brand-ink/70 txt-small"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className={clx(
                            footerLinkClassName,
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
                                  className={footerLinkClassName}
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
                <span className="txt-small-plus text-brand-ink">
                  {SITE_COPY.collections}
                </span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-brand-ink/70 txt-small",
                    {
                      "grid-cols-2": collectionsWithProducts.length > 3,
                    }
                  )}
                >
                  {collectionsWithProducts.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className={footerLinkClassName}
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
              <span className="txt-small-plus text-brand-ink">
                {SITE_COPY.shop}
              </span>
              <ul className="grid grid-cols-1 gap-y-2 text-brand-ink/70 txt-small">
                <li>
                  <LocalizedClientLink
                    className={footerLinkClassName}
                    href="/store"
                  >
                    {SITE_COPY.shopAll}
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className={footerLinkClassName}
                    href="/account"
                  >
                    {SITE_COPY.account}
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className={footerLinkClassName}
                    href="/cart"
                  >
                    {SITE_COPY.bag}
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
            {supportLinks.length > 0 ? (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-brand-ink">Support</span>
                <ul className="grid grid-cols-1 gap-y-2 text-brand-ink/70 txt-small">
                  {supportLinks.map((link) => (
                    <li key={`${link.label}-${link.href}`}>
                      <FooterLinkItem href={link.href}>
                        {link.label}
                      </FooterLinkItem>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {aboutLinks.length > 0 ? (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-brand-ink">About</span>
                <ul className="grid grid-cols-1 gap-y-2 text-brand-ink/70 txt-small">
                  {aboutLinks.map((link) => (
                    <li key={`${link.label}-${link.href}`}>
                      <FooterLinkItem href={link.href}>
                        {link.label}
                      </FooterLinkItem>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {moreLinks.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-brand-ink">More</span>
                <ul className="grid grid-cols-1 gap-y-2 text-brand-ink/70 txt-small">
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
        <div className="flex w-full mb-16 justify-between text-brand-ink/55">
          <Text className="txt-compact-small">{SITE_COPYRIGHT}</Text>
        </div>
      </div>
    </footer>
  )
}
