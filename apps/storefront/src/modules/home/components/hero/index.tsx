import {
  SITE_COPY,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@lib/constants/site"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button, Heading, Text, clx } from "@modules/common/components/ui"

type HeroProps = {
  collectionsHref?: string
  backgroundImageUrl?: string | null
}

const Hero = ({
  collectionsHref = "/store",
  backgroundImageUrl = null,
}: HeroProps) => {
  const hasBackgroundImage = Boolean(backgroundImageUrl)

  return (
    <section className="relative w-full overflow-hidden border-b border-ui-border-base">
      <div
        className={clx(
          "relative",
          hasBackgroundImage
            ? "min-h-[24rem] small:min-h-[28rem]"
            : "bg-gradient-to-b from-brand-mist via-brand-mist/80 to-white"
        )}
      >
        {hasBackgroundImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={backgroundImageUrl!}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              fetchPriority="high"
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/70 to-white/85"
              aria-hidden
            />
          </>
        )}

        <div className="content-container relative flex flex-col items-center justify-center px-6 py-20 text-center small:py-24">
          <div className="flex max-w-2xl flex-col items-center gap-7">
            <div className="flex flex-col gap-4">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-sea">
                {SITE_NAME}
              </p>
              <Heading
                level="h1"
                className="font-display text-4xl font-normal leading-[1.1] tracking-tight text-brand-ink small:text-5xl"
              >
                {SITE_TAGLINE}
              </Heading>
              <Text
                as="p"
                className="mx-auto max-w-xl text-base-regular text-ui-fg-subtle small:text-lg"
              >
                {SITE_DESCRIPTION}
              </Text>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <LocalizedClientLink href="/store">
                <Button className="bg-brand-sea text-white hover:bg-brand-sea/90 border-brand-sea">
                  {SITE_COPY.shopTheEdit}
                </Button>
              </LocalizedClientLink>
              <LocalizedClientLink href={collectionsHref}>
                <Button variant="secondary">{SITE_COPY.exploreCollections}</Button>
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
