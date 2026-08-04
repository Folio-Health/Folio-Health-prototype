"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BellIcon, LogOutIcon, MenuIcon, HelpCircleIcon } from "lucide-react"
import { Logo } from "@/components/common/logo"
import { PersonAvatar } from "@/components/common/person-avatar"
import { clearSessionCookie } from "@/lib/session"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/navigation/theme-toggle"
import { PATIENT_PORTAL_NAV } from "@/config/nav"
import { PORTAL_PATIENT, getPortalUnreadMessageCount } from "@/lib/mock/portal"
import { cn } from "@/lib/utils"

const PORTAL_ALERTS = [
  {
    id: "alert-1",
    title: "Lab results ready",
    message: "Your recent lab report has been reviewed and is ready to view.",
  },
  {
    id: "alert-2",
    title: "Upcoming appointment",
    message: "You have a visit coming up. Check the Appointments page for details.",
  },
  {
    id: "alert-3",
    title: "Invoice reminder",
    message: "You have an outstanding balance on your account.",
  },
]

function PortalNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-0.5">
      {PATIENT_PORTAL_NAV.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive &&
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            )}
          >
            <Icon className="size-[18px] shrink-0" />
            <span className="truncate">{item.title}</span>
          </Link>
        )
      })}
    </div>
  )
}

function PortalSidebar() {
  return (
    <aside className="sticky top-0 z-30 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
        <Logo size={28} wordmarkClassName="text-[15px]" />
      </div>
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        <p className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
          Patient Portal
        </p>
        <PortalNavLinks />
      </nav>
      <div className="flex shrink-0 items-center gap-2.5 border-t border-sidebar-border p-3">
        <PersonAvatar name={PORTAL_PATIENT.name} seed={PORTAL_PATIENT.avatarSeed} size="sm" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-sidebar-foreground">
            {PORTAL_PATIENT.name}
          </span>
          <span className="truncate text-xs text-muted-foreground">{PORTAL_PATIENT.mrn}</span>
        </div>
      </div>
    </aside>
  )
}

function PortalMobileSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  void pathname

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Patient portal navigation</SheetDescription>
        </SheetHeader>
        <div className="flex h-16 shrink-0 items-center border-b border-border px-4">
          <Logo size={28} />
        </div>
        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
          <PortalNavLinks onNavigate={() => setOpen(false)} />
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

function PortalNotificationBell() {
  const unread = getPortalUnreadMessageCount()

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative" />
        }
      >
        <BellIcon className="size-4.5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <div className="border-b border-border px-3.5 py-3">
          <p className="font-heading text-sm font-semibold text-foreground">Notifications</p>
        </div>
        <div className="flex flex-col">
          {PORTAL_ALERTS.map((a) => (
            <div key={a.id} className="flex flex-col gap-0.5 border-b border-border px-3.5 py-3 last:border-b-0">
              <p className="text-sm font-medium text-foreground">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.message}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function PortalProfileMenu() {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="Account menu"
          />
        }
      >
        <PersonAvatar name={PORTAL_PATIENT.name} seed={PORTAL_PATIENT.avatarSeed} size="sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="flex items-center gap-2.5 px-1.5 py-1.5">
          <PersonAvatar name={PORTAL_PATIENT.name} seed={PORTAL_PATIENT.avatarSeed} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {PORTAL_PATIENT.name}
            </span>
            <span className="truncate text-xs text-muted-foreground">{PORTAL_PATIENT.email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/help" />}>
          <HelpCircleIcon />
          Help Center
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            clearSessionCookie()
            router.push("/login")
          }}
        >
          <LogOutIcon />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PortalTopbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <PortalMobileSidebar />
      <div className="flex flex-col leading-tight lg:hidden">
        <span className="text-sm font-medium text-foreground">{PORTAL_PATIENT.name}</span>
        <span className="text-xs text-muted-foreground">{PORTAL_PATIENT.mrn}</span>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <PortalNotificationBell />
        <ThemeToggle />
        <div className="mx-1 h-6 w-px bg-border" />
        <PortalProfileMenu />
      </div>
    </header>
  )
}

function PortalShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-background">
      <PortalSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalTopbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}

export { PortalShell }
