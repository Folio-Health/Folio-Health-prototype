"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300",
        scrolled || open
          ? "border-white/10 bg-[#0E443B]/95 backdrop-blur-md"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo size={26} tone="inverted" />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" render={<Link href="/login" />}>
            Sign In
          </Button>
          <Button render={<Link href="/signup" />}>Get Started</Button>
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

      {open && (
        <div className="flex flex-col gap-1 border-t border-white/10 bg-[#0E443B] px-5 py-4 md:hidden">
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
      )}
    </header>
  )
}

export { MarketingNavbar }
