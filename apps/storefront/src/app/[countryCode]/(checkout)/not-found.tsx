import InteractiveLink from "@modules/common/components/interactive-link"
import { SITE_COPY } from "@lib/constants/site"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "404",
  description: SITE_COPY.notFoundBody,
}

export default async function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="font-display text-3xl font-normal tracking-tight text-brand-ink">
        {SITE_COPY.notFoundTitle}
      </h1>
      <p className="text-small-regular text-ui-fg-subtle">{SITE_COPY.notFoundBody}</p>
      <InteractiveLink href="/">{SITE_COPY.backHome}</InteractiveLink>
    </div>
  )
}
