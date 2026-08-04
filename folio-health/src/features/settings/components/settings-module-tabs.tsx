"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLinkIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/settings/branding", label: "Hospital Branding" },
  { href: "/settings/theme", label: "Theme" },
  { href: "/settings/localization", label: "Localization" },
  { href: "/administration/departments", label: "Departments", external: true },
  { href: "/settings/notifications", label: "Notification Preferences" },
  { href: "/settings/email", label: "Email Configuration" },
  { href: "/settings/sms", label: "SMS Configuration" },
]

function SettingsModuleTabs() {
  const pathname = usePathname()

  return (
    <nav className="mb-6 flex w-fit max-w-full flex-wrap items-center gap-1 rounded-lg bg-muted p-0.75">
      {LINKS.map((link) => {
        const isActive = !link.external && pathname?.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            )}
          >
            {link.label}
            {link.external && <ExternalLinkIcon className="size-3" />}
          </Link>
        )
      })}
    </nav>
  )
}

export { SettingsModuleTabs }
