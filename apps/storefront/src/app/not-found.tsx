import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@modules/common/components/ui"
import { SITE_COPY } from "@lib/constants/site"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "404",
  description: SITE_COPY.notFoundBody,
}

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="font-display text-3xl font-normal tracking-tight text-brand-ink">
        {SITE_COPY.notFoundTitle}
      </h1>
      <p className="text-small-regular text-ui-fg-subtle">{SITE_COPY.notFoundBody}</p>
      <Link className="flex gap-x-1 items-center group" href="/">
        <Text className="text-ui-fg-interactive">{SITE_COPY.backHome}</Text>
        <ArrowUpRightMini
          className="group-hover:rotate-45 ease-in-out duration-150"
          color="var(--fg-interactive)"
        />
      </Link>
    </div>
  )
}
