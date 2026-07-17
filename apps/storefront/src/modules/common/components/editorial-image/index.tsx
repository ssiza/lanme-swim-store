import { clx } from "@modules/common/components/ui"

type EditorialImageProps = {
  desktopSrc: string
  mobileSrc?: string | null
  alt: string
  priority?: boolean
  className?: string
  imageClassName?: string
}

/**
 * Full-bleed CMS photography.
 * Uses native <img> (not next/image) so S3 / Medusa upload hosts are never
 * blocked by remotePatterns, while still supporting lazy-load + art direction.
 */
const EditorialImage = ({
  desktopSrc,
  mobileSrc = null,
  alt,
  priority = false,
  className,
  imageClassName,
}: EditorialImageProps) => {
  const mobile = mobileSrc || desktopSrc
  const shared = clx(
    "absolute inset-0 h-full w-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.03]",
    imageClassName
  )

  return (
    <div className={clx("absolute inset-0 overflow-hidden", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mobile}
        alt={alt}
        className={clx(shared, "small:hidden")}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={desktopSrc}
        alt={alt}
        className={clx(shared, "hidden small:block")}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
    </div>
  )
}

export default EditorialImage
