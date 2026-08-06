"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/lib/fhir/use-current-user"

interface SettingsLink {
  href: string
  label: string
  /** Facility-plane only — hidden from the platform operator. */
  facilityOnly?: boolean
}

/**
 * Settings tabs, scoped by plane.
 *
 * Hospital branding and notification preferences configure a FACILITY, so they
 * have no meaning on a platform account that owns no facility. Profile and
 * theme are personal and belong to everyone.
 *
 * Departments used to be cross-linked here, but a department belongs to a
 * facility's administration rather than to settings, so it lives under
 * /administration and is reached from there.
 *
 * Email and SMS gateway configuration were removed outright: they are
 * deployment infrastructure that belongs in server configuration, not a form
 * in the app.
 */
const LINKS: SettingsLink[] = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/branding", label: "Hospital Branding", facilityOnly: true },
  { href: "/settings/theme", label: "Theme" },
  { href: "/settings/localization", label: "Localization" },
  { href: "/settings/notifications", label: "Notification Preferences", facilityOnly: true },
]

function SettingsModuleTabs() {
  const pathname = usePathname()
  const { data: user } = useCurrentUser()
  const platformOnly = user?.platformOnly ?? false

  const links = LINKS.filter((link) => !(link.facilityOnly && platformOnly))

  return (
    <nav className="mb-6 flex w-fit max-w-full flex-wrap items-center gap-1 rounded-lg bg-muted p-0.75">
      {links.map((link) => {
        const isActive = pathname?.startsWith(link.href)
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
          </Link>
        )
      })}
    </nav>
  )
}

export { SettingsModuleTabs }
