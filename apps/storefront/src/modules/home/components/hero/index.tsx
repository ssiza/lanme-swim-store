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
            ? "min-h-[22rem] small:min-h-[26rem]"
            : "bg-ui-bg-subtle"
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
              className="absolute inset-0 bg-white/80"
              aria-hidden
            />
          </>
        )}

        <div className="content-container relative flex flex-col items-center justify-center px-6 py-16 text-center small:py-20">
          <div className="flex max-w-2xl flex-col items-center gap-6">
            <div className="flex flex-col gap-3">
              <Heading
                level="h1"
                className="text-3xl font-normal leading-tight text-ui-fg-base small:text-4xl"
              >
                Lanmè Swim — made for sun and sea.
              </Heading>
              <Text
                as="p"
                className="text-base-regular text-ui-fg-subtle small:text-lg"
              >
                Bikinis, one-pieces, and beach essentials designed for
                confidence by the water.
              </Text>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <LocalizedClientLink href="/store">
                <Button variant="secondary">Shop now</Button>
              </LocalizedClientLink>
              <LocalizedClientLink href={collectionsHref}>
                <Button variant="secondary">View Collections</Button>
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
