"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

function HowItWorksStep({
  icon,
  step,
  title,
  description,
  delay = 0,
}: {
  icon: ReactNode
  step: number
  title: string
  description: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col items-center gap-3 text-center"
    >
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        whileHover={{ scale: 1.12, rotate: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 14, delay: delay + 0.1 }}
        className="relative z-10 flex size-12 items-center justify-center rounded-full border border-border bg-background text-primary shadow-sm"
      >
        {icon}
      </motion.span>
      <p className="text-xs font-semibold text-muted-foreground">Step {step}</p>
      <p className="font-heading text-base font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  )
}

export { HowItWorksStep }
