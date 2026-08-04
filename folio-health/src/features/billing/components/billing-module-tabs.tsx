"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/billing", label: "Invoices" },
  { href: "/billing/payments", label: "Payments" },
  { href: "/billing/claims", label: "Claims" },
  { href: "/billing/outstanding", label: "Outstanding" },
  { href: "/billing/refunds", label: "Refunds" },
  { href: "/billing/summary", label: "Summary" },
]

function BillingModuleTabs() {
  const pathname = usePathname()

  return (
    <nav className="mb-6 flex w-fit max-w-full flex-wrap items-center gap-1 rounded-lg bg-muted p-0.75">
      {LINKS.map((link) => {
        const isActive = link.href === "/billing" ? pathname === link.href : pathname?.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex h-7 items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

export { BillingModuleTabs }
