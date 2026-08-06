"use client"

import { motion } from "framer-motion"

/** A horizontal connector that draws itself in left-to-right on scroll, with a
 * traveling highlight pulse — used to visually link a row of numbered steps. */
function AnimatedConnectorLine({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "left" }}
        className="relative h-px w-full bg-border"
      >
        <motion.div
          initial={{ left: "0%", opacity: 0 }}
          whileInView={{ left: "100%", opacity: [0, 1, 1, 0] }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, delay: 0.4, ease: "easeInOut" }}
          className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_2px_var(--primary)]"
        />
      </motion.div>
    </div>
  )
}

export { AnimatedConnectorLine }
