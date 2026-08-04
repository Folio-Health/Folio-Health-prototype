"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { unsplash } from "@/lib/images"

/**
 * Large alternating image/text row — for pages where a handful of
 * capabilities each deserve real visual weight, rather than a grid of small
 * cards. Odd rows put the photo on the right, even rows flip it to the left.
 */
function FeatureShowcaseRow({
  index,
  title,
  description,
  details,
  image,
  icon,
}: {
  index: number
  title: string
  description: string
  details?: string[]
  image: string
  icon: ReactNode
}) {
  const reversed = index % 2 === 1

  return (
    <div
      className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
        reversed ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <motion.div
        className="relative aspect-4/3 overflow-hidden rounded-3xl sm:aspect-video lg:aspect-4/3"
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Image
          src={unsplash(image, { w: 1200, h: 900, q: 75 })}
          alt=""
          fill
          aria-hidden="true"
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span className="absolute top-4 left-4 flex size-11 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-md">
          {icon}
        </span>
      </motion.div>

      <motion.div
        className="flex flex-col gap-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      >
        <h3 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h3>
        <p className="text-base text-muted-foreground">{description}</p>
        {details && details.length > 0 && (
          <ul className="mt-1 flex flex-col gap-2.5">
            {details.map((detail) => (
              <li key={detail} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {detail}
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  )
}

export { FeatureShowcaseRow }
