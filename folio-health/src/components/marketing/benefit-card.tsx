"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

function BenefitCard({
  title,
  description,
  detail,
  icon,
}: {
  title: string
  description: string
  detail: string
  /** Pre-rendered icon element — a raw component reference can't cross the
   * server-to-client boundary, so the caller renders `<Icon />` itself. */
  icon: ReactNode
}) {
  return (
    <motion.div
      className="flex cursor-default flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6"
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={{ hover: { boxShadow: "0 12px 32px -12px rgb(0 0 0 / 0.18)" } }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
        variants={{ hover: { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" } }}
        transition={{ duration: 0.3 }}
      >
        {icon}
      </motion.span>
      <p className="font-heading text-base font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      <motion.div
        className="overflow-hidden"
        variants={{
          rest: { opacity: 0, height: 0, paddingTop: 0 },
          hover: { opacity: 1, height: "auto", paddingTop: 12 },
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <p className="border-t border-border pt-3 text-sm text-foreground/80">{detail}</p>
      </motion.div>
    </motion.div>
  )
}

export { BenefitCard }
