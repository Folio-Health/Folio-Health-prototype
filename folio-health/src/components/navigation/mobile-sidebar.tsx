"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Logo } from "@/components/common/logo"
import { useScopedNav } from "@/lib/auth/use-scoped-nav"
import { cn } from "@/lib/utils"

function MobileSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const navSections = useScopedNav()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Folio Health EMR module navigation</SheetDescription>
        </SheetHeader>
        <div className="flex h-16 shrink-0 items-center border-b border-border px-4">
          <Logo size={28} />
        </div>
        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-4">
            {(navSections ?? []).map((section) => (
              <div key={section.label} className="flex flex-col gap-0.5">
                <p className="px-2.5 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
                  {section.label}
                </p>
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + "/")
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted",
                        isActive && "bg-primary text-primary-foreground hover:bg-primary"
                      )}
                    >
                      <Icon className="size-[18px] shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
        </nav>
      </SheetContent>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <MenuIcon className="size-5" />
      </Button>
    </Sheet>
  )
}

export { MobileSidebar }
