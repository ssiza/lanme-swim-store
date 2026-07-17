import { SITE_NAME } from "@lib/constants/site"
import type { HomepageHeroSlide } from "@lib/data/homepage"
import { resolveResponsiveImagePair } from "@lib/util/responsive-image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import EditorialImage from "@modules/common/components/editorial-image"
import { clx } from "@modules/common/components/ui"

type HeroProps = {
  slides?: HomepageHeroSlide[]
  /** @deprecated use slides */
  backgroundImageUrl?: string | null
  collectionsHref?: string
}

const Hero = ({
  slides = [],
  backgroundImageUrl = null,
  collectionsHref = "/store",
}: HeroProps) => {
  const slide =
    slides[0] ??
    (backgroundImageUrl
      ? {
          id: "legacy",
          desktop_image_url: backgroundImageUrl,
          mobile_image_url: null,
          headline: null,
          subheadline: null,
          cta_label: null,
          cta_href: null,
          sort_order: 0,
        }
      : null)

  const imagePair = resolveResponsiveImagePair(
    slide?.desktop_image_url,
    slide?.mobile_image_url
  )
  const hasImage = Boolean(imagePair)
  const headline = slide?.headline?.trim() || SITE_NAME
  const subheadline = slide?.subheadline?.trim() || null
  const ctaLabel = slide?.cta_label?.trim() || "Shop resort"
  const ctaHref = slide?.cta_href?.trim() || collectionsHref

  return (
    <section className="relative w-full overflow-hidden">
      <div
        className={clx(
          "group relative flex min-h-[78vh] w-full items-end small:min-h-[88vh] small:items-center",
          !hasImage && "bg-brand-mist"
        )}
      >
        {imagePair ? (
          <>
            <EditorialImage
              desktopSrc={imagePair.desktop}
              mobileSrc={imagePair.mobile}
              alt=""
              priority
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-brand-ink/55 via-brand-ink/15 to-brand-ink/10 small:bg-gradient-to-r small:from-brand-ink/50 small:via-brand-ink/20 small:to-transparent"
              aria-hidden
            />
          </>
        ) : null}

        <div className="content-container relative z-10 w-full px-6 py-16 small:py-24">
          <div
            className={clx(
              "flex max-w-xl flex-col items-start gap-6 text-left",
              hasImage ? "text-white" : "text-brand-ink"
            )}
          >
            <p
              className={clx(
                "text-[11px] font-medium uppercase tracking-[0.22em]",
                hasImage ? "text-white/80" : "text-brand-ink/60"
              )}
            >
              {SITE_NAME}
            </p>
            <h1 className="font-display text-4xl font-normal leading-[1.05] tracking-tight small:text-6xl">
              {headline}
            </h1>
            {subheadline ? (
              <p
                className={clx(
                  "max-w-md text-base font-normal leading-relaxed small:text-lg",
                  hasImage ? "text-white/85" : "text-brand-ink/70"
                )}
              >
                {subheadline}
              </p>
            ) : null}
            <LocalizedClientLink
              href={ctaHref}
              className={clx(
                "inline-flex items-center justify-center px-7 py-3 text-sm font-medium tracking-wide transition-colors duration-300",
                hasImage
                  ? "border border-white/80 bg-white/10 text-white backdrop-blur-[2px] transition-colors hover:bg-white hover:text-brand-ink"
                  : "border border-brand-ink bg-brand-ink text-white hover:bg-transparent hover:text-brand-ink"
              )}
            >
              {ctaLabel}
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
