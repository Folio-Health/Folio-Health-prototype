"use client"

import { motion } from "framer-motion"

/**
 * Large ghost-tint wordmark used to fill quiet whitespace next to shorter
 * copy blocks — animates in on scroll rather than sitting static.
 */
function WordmarkReveal({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex flex-col leading-[0.9] select-none"
      >
        <motion.span
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.05, ease: "easeOut" }}
          className="font-heading text-6xl font-bold tracking-tight text-primary/15 sm:text-7xl lg:text-8xl"
        >
          FOLIO
        </motion.span>
        <motion.span
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="font-heading text-6xl font-bold tracking-tight text-foreground/10 sm:text-7xl lg:text-8xl"
        >
          HEALTH
        </motion.span>
      </motion.div>
    </div>
  )
}

export { WordmarkReveal }
