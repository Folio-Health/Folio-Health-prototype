"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PanelLeftIcon } from "lucide-react"
import { Logo, LogoMark } from "@/components/common/logo"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useUiStore } from "@/stores/ui-store"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { useScopedNav } from "@/lib/auth/use-scoped-nav"
import { ROLE_LABELS } from "@/lib/auth/roles"
import { cn } from "@/lib/utils"

function AppSidebar() {
  const pathname = usePathname()
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const previewRole = useUiStore((s) => s.previewRole)
  const { data: user } = useCurrentUser()
  const navSections = useScopedNav()
  // Who is actually signed in, per Medplum — not a mock staff record picked by
  // whatever role happens to be selected locally. The subtitle reflects
  // "preview as role" when active (matching the nav and dashboard, which do
  // the same), so what's shown here always matches what's actually rendered.
  // "Preview" is a separate badge rather than appended text — the longest
  // role label ("Medical Records Officer") already fills the sidebar width,
  // and suffixing it would just get truncated away right when it matters most.
  const currentUser = user
    ? {
        name: user.name,
        role: previewRole
          ? ROLE_LABELS[previewRole]
          : user.roles.length
            ? user.roles.map((r) => ROLE_LABELS[r]).join(" · ")
            : (user.facilityName ?? user.project ?? "Staff"),
      }
    : null

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-sidebar-border px-4",
          collapsed ? "justify-center px-0" : "justify-between"
        )}
      >
        {collapsed ? (
          <LogoMark size={30} />
        ) : (
          <Logo size={28} wordmarkClassName="text-[15px]" />
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
          >
            <PanelLeftIcon className="size-4" />
          </Button>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        {collapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
            className="mx-auto mb-3 flex"
          >
            <PanelLeftIcon className="size-4" />
          </Button>
        )}
        <div className="flex flex-col gap-4">
          {(navSections ?? []).map((section) => (
            <div key={section.label} className="flex flex-col gap-0.5">
              {!collapsed && (
                <p className="px-2.5 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/")
                const Icon = item.icon
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      collapsed && "justify-center px-0 py-2.5",
                      isActive &&
                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                  >
                    <Icon className="size-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </Link>
                )

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger render={link} />
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  )
                }
                return link
              })}
            </div>
          ))}
        </div>
      </nav>

      {currentUser && (
        <div
          className={cn(
            "flex shrink-0 items-center gap-2.5 border-t border-sidebar-border p-3",
            collapsed && "justify-center"
          )}
        >
          <PersonAvatar name={currentUser.name} size="sm" />
          {!collapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {currentUser.name}
              </span>
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-xs text-muted-foreground">{currentUser.role}</span>
                {previewRole && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-medium text-primary">
                    Preview
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}

export { AppSidebar }
