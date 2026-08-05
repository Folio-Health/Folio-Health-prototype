"use client"

import { motion, type Variants } from "framer-motion"

const CORAL = "#E65A4F"
const MINT = "#7FC9BC"

const FOLIO_LETTERS = "FOLIO".split("")
const HEALTH_LETTERS = "HEALTH".split("")

const letterVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  }),
}

/**
 * Large animated "FOLIO HEALTH" wordmark used to fill quiet whitespace next
 * to shorter copy blocks — letters cascade in on scroll, then react to
 * hover; the trailing dot and ECG underline echo the Folio brand mark.
 */
function WordmarkReveal({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="flex flex-col gap-2 select-none"
      >
        <div className="flex items-baseline">
          {FOLIO_LETTERS.map((letter, i) => (
            <motion.span
              key={i}
              custom={i}
              variants={letterVariants}
              whileHover={{ y: -10, scale: 1.08, color: CORAL }}
              transition={{ type: "spring", stiffness: 320, damping: 14 }}
              className="inline-block font-heading text-6xl font-bold tracking-tight text-primary sm:text-7xl lg:text-8xl"
            >
              {letter}
            </motion.span>
          ))}
        </div>

        <div className="ml-1 flex items-center gap-3">
          <div className="flex items-baseline">
            {HEALTH_LETTERS.map((letter, i) => (
              <motion.span
                key={i}
                custom={FOLIO_LETTERS.length + i}
                variants={letterVariants}
                whileHover={{ y: -4, color: MINT }}
                transition={{ type: "spring", stiffness: 320, damping: 14 }}
                className="inline-block text-lg font-semibold tracking-[0.4em] text-muted-foreground sm:text-xl"
              >
                {letter}
              </motion.span>
            ))}
          </div>
          <motion.span
            className="size-2.5 rounded-full bg-brand-coral"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.55, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* ECG-style underline, echoing the heartbeat line in the Folio mark */}
        <motion.svg
          viewBox="0 0 320 40"
          className="mt-1 h-6 w-56 sm:w-64"
          fill="none"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <motion.path
            d="M0 20 H90 L104 4 L120 36 L134 20 H180 L192 8 L204 32 L216 20 H320"
            stroke={MINT}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.55, ease: "easeInOut" }}
          />
        </motion.svg>
      </motion.div>
    </div>
  )
}

export { WordmarkReveal }
