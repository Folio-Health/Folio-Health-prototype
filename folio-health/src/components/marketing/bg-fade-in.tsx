"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

/**
 * Fades in on mount (not scroll) — for decorative background images sitting
 * just below the fold. A scroll-triggered `whileInView` fade there needs the
 * reader to scroll past a margin before it fires, which reads as a blank gap
 * rather than a fade.
 */
function BgFadeIn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

export { BgFadeIn }
