"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { CheckCheckIcon, InfoIcon, CheckCircle2Icon, TriangleAlertIcon, SirenIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { EmptyState } from "@/components/common/empty-state"
import { CommunicationModuleTabs } from "./communication-module-tabs"
import { NOTIFICATIONS as INITIAL_NOTIFICATIONS } from "@/lib/mock/notifications"
import type { AppNotification } from "@/types/core"
import { cn } from "@/lib/utils"

const TYPE_ICON: Record<AppNotification["type"], typeof InfoIcon> = {
  info: InfoIcon,
  success: CheckCircle2Icon,
  warning: TriangleAlertIcon,
  critical: SirenIcon,
}

const TYPE_STYLES: Record<AppNotification["type"], string> = {
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  critical: "bg-red-500/10 text-red-600 dark:text-red-400",
}

type Filter = "all" | "unread" | AppNotification["type"]

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
]

function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS)
  const [filter, setFilter] = useState<Filter>("all")

  const unreadCount = notifications.filter((n) => !n.read).length

  const filtered = useMemo(() => {
    if (filter === "all") return notifications
    if (filter === "unread") return notifications.filter((n) => !n.read)
    return notifications.filter((n) => n.type === filter)
  }, [notifications, filter])

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function markOneRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="All system and staff notifications in one place"
        breadcrumbs={[
          { label: "Insights" },
          { label: "Communication", href: "/communication" },
          { label: "Notifications" },
        ]}
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheckIcon className="size-3.5" />
            Mark all as read
          </Button>
        }
      />

      <CommunicationModuleTabs />

      <Tabs value={filter} onValueChange={(v) => setFilter((v as Filter) ?? "all")}>
        <TabsList className="mb-4">
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
              {f.value === "unread" && unreadCount > 0 && (
                <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={filter}>
          {filtered.length === 0 ? (
            <EmptyState
              title="No notifications"
              description="You're all caught up, nothing to see here for this filter."
            />
          ) : (
            <div className="flex flex-col overflow-hidden rounded-xl border border-border">
              {filtered.map((n) => {
                const Icon = TYPE_ICON[n.type]
                return (
                  <Link
                    key={n.id}
                    href={n.href ?? "#"}
                    onClick={() => markOneRead(n.id)}
                    className={cn(
                      "flex items-start gap-3 border-b border-border px-4 py-3.5 last:border-b-0 hover:bg-muted/50",
                      !n.read && "bg-primary/3"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                        TYPE_STYLES[n.type]
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground/70">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { NotificationsPage }
