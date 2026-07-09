import { LOGO_SRC, SITE_NAME } from "@lib/constants/site"
import { clx } from "@modules/common/components/ui"

type SiteLogoProps = {
  className?: string
  /** Rendered height in px; width scales to preserve aspect ratio. */
  height?: number
  priority?: boolean
}

export default function SiteLogo({
  className,
  height = 32,
  priority = false,
}: SiteLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt={SITE_NAME}
      height={height}
      className={clx("block shrink-0 w-auto object-contain", className)}
      style={{ height }}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  )
}
