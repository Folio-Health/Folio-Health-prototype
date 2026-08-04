"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/nursing", label: "Assigned Patients" },
  { href: "/nursing/mar", label: "MAR" },
  { href: "/nursing/tasks", label: "Tasks" },
  { href: "/nursing/care-plans", label: "Care Plans" },
  { href: "/nursing/notes", label: "Notes" },
  { href: "/nursing/shift-notes", label: "Shift Notes" },
]

function NursingModuleTabs() {
  const pathname = usePathname()

  return (
    <nav className="mb-6 flex w-fit max-w-full flex-wrap items-center gap-1 rounded-lg bg-muted p-0.75">
      {LINKS.map((link) => {
        const isActive = link.href === "/nursing" ? pathname === link.href : pathname?.startsWith(link.href)
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

export { NursingModuleTabs }
