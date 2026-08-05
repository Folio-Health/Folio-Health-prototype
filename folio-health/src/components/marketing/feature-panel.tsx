"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { unsplash } from "@/lib/images"

interface FeaturePanelProps {
  title: string
  description: string
  details: string[]
  image: string
}

/**
 * Hover reveal is driven by Framer's `whileHover` (real pointer tracking)
 * rather than CSS `group-hover`, so it can't silently no-op if a class never
 * makes it into the generated stylesheet.
 */
function FeaturePanel({ title, description, details, image }: FeaturePanelProps) {
  return (
    <motion.div
      className="relative aspect-4/3 cursor-default overflow-hidden sm:aspect-square"
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <motion.div
        className="absolute inset-0"
        variants={{ rest: { scale: 1 }, hover: { scale: 1.06 } }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Image
          src={unsplash(image, { w: 1100, h: 1100, q: 72 })}
          alt={title}
          fill
          className="object-cover"
          sizes="(min-width: 640px) 50vw, 100vw"
        />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/0" />
      <motion.div
        className="absolute inset-0 bg-black"
        variants={{ rest: { opacity: 0 }, hover: { opacity: 0.25 } }}
        transition={{ duration: 0.3 }}
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-6 sm:p-8">
        <h3 className="font-heading text-xl font-semibold text-white">{title}</h3>
        <p className="max-w-sm text-sm text-white/75">{description}</p>
        <motion.div
          className="flex flex-col gap-1.5 overflow-hidden border-t border-white/15"
          variants={{
            rest: { opacity: 0, height: 0, paddingTop: 0, marginTop: 0 },
            hover: { opacity: 1, height: "auto", paddingTop: 12, marginTop: 8 },
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {details.map((detail) => (
            <p key={detail} className="flex items-start gap-2 text-xs text-white/80">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand-mint" />
              {detail}
            </p>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}

export { FeaturePanel }
