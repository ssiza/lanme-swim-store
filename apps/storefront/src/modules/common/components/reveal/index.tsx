"use client"

import { clx } from "@modules/common/components/ui"
import { useEffect, useRef, useState, type ReactNode } from "react"

type RevealProps = {
  children: ReactNode
  className?: string
  /** Stagger delay in ms */
  delayMs?: number
}

/**
 * Soft scroll fade/rise — premium, not flashy.
 * Respects prefers-reduced-motion.
 */
const Reveal = ({ children, className, delayMs = 0 }: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) {
      return
    }

    if (typeof window === "undefined") {
      return
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    if (reduceMotion) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={clx(
        "transition-[opacity,transform] duration-700 ease-out will-change-[opacity,transform]",
        visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
        className
      )}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  )
}

export default Reveal
