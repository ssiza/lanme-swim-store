import { Metadata } from "next"

import { SITE_COPY } from "@lib/constants/site"
import InteractiveLink from "@modules/common/components/interactive-link"

export const metadata: Metadata = {
  title: "404",
  description: SITE_COPY.notFoundBody,
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-4">
      <h1 className="font-display text-3xl font-normal tracking-tight text-brand-ink">
        {SITE_COPY.notFoundTitle}
      </h1>
      <p className="text-small-regular text-ui-fg-subtle text-center max-w-md">
        The bag you tried to access does not exist. Clear your cookies and try
        again.
      </p>
      <InteractiveLink href="/">{SITE_COPY.backHome}</InteractiveLink>
    </div>
  )
}
