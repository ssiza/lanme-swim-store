import { resolveResponsiveImagePair } from "@lib/util/responsive-image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import EditorialImage from "@modules/common/components/editorial-image"
import Reveal from "@modules/common/components/reveal"
import { clx } from "@modules/common/components/ui"

type ImageBannerProps = {
  title: string
  subtitle?: string | null
  description?: string | null
  desktopImage?: string | null
  mobileImage?: string | null
  ctaLabel?: string | null
  href: string
  /** Visual density */
  size?: "tall" | "medium"
  align?: "left" | "center" | "right"
  priority?: boolean
}

const ImageBanner = ({
  title,
  subtitle = null,
  description = null,
  desktopImage = null,
  mobileImage = null,
  ctaLabel = "Explore",
  href,
  size = "tall",
  align = "left",
  priority = false,
}: ImageBannerProps) => {
  const imagePair = resolveResponsiveImagePair(desktopImage, mobileImage)

  if (!imagePair) {
    return null
  }

  return (
    <Reveal>
      <section className="relative w-full overflow-hidden">
        <LocalizedClientLink
          href={href}
          className={clx(
            "group relative flex w-full items-end overflow-hidden",
            size === "tall"
              ? "min-h-[70vh] small:min-h-[78vh]"
              : "min-h-[52vh] small:min-h-[60vh]"
          )}
        >
          <EditorialImage
            desktopSrc={imagePair.desktop}
            mobileSrc={imagePair.mobile}
            alt={title}
            priority={priority}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-brand-ink/60 via-brand-ink/15 to-transparent"
            aria-hidden
          />

          <div
            className={clx(
              "content-container relative z-10 flex w-full flex-col gap-3 px-6 py-12 text-white small:py-16",
              align === "center" && "items-center text-center",
              align === "right" && "items-end text-right",
              align === "left" && "items-start text-left"
            )}
          >
            {subtitle ? (
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/75">
                {subtitle}
              </p>
            ) : null}
            <h2 className="font-display text-3xl font-normal tracking-tight small:text-5xl">
              {title}
            </h2>
            {description ? (
              <p className="max-w-md text-sm leading-relaxed text-white/85 small:text-base">
                {description}
              </p>
            ) : null}
            {ctaLabel ? (
              <span className="mt-2 inline-flex border-b border-white/80 pb-0.5 text-sm tracking-wide transition-opacity duration-300 group-hover:opacity-80">
                {ctaLabel}
              </span>
            ) : null}
          </div>
        </LocalizedClientLink>
      </section>
    </Reveal>
  )
}

export default ImageBanner
