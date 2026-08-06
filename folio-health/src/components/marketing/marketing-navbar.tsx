"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { MenuIcon, XIcon } from "lucide-react"
import { Logo } from "@/components/common/logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Modules", href: "/#modules" },
  { label: "Capabilities", href: "/capabilities" },
  { label: "FAQs", href: "/faqs" },
  { label: "Support", href: "/support" },
  { label: "About", href: "/#about" },
]

function MarketingNavbar() {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#0E443B]/80 backdrop-blur-lg transition-shadow duration-300",
        open && "shadow-lg"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="transition-transform duration-200 hover:scale-105">
          <Logo size={26} tone="inverted" />
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          onMouseLeave={() => setHovered(null)}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onMouseEnter={() => setHovered(link.href)}
              className="relative px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {hovered === link.href && (
                <motion.span
                  layoutId="navbar-hover-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-white/10"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" render={<Link href="/login" />}>
            Sign In
          </Button>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button render={<Link href="/signup" />}>Get Started</Button>
          </motion.div>
        </div>

        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-lg text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-white/10 bg-[#0E443B]/95 backdrop-blur-lg md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2 px-3">
                <Button
                  variant="outline"
                  className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  render={<Link href="/login" />}
                >
                  Sign In
                </Button>
                <Button render={<Link href="/signup" />}>Get Started</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

export { MarketingNavbar }
