"use client"

import { useState } from "react"
import Link from "next/link"
import type { Route } from "next"
import { formatDistanceToNow } from "date-fns"
import { BellIcon, CheckCheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { NOTIFICATIONS as INITIAL_NOTIFICATIONS } from "@/lib/mock/notifications"
import { cn } from "@/lib/utils"

const TYPE_DOT: Record<string, string> = {
  info: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
}

function NotificationCenter() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative" />
        }
      >
        <BellIcon className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 gap-0 p-0">
        <div className="flex items-center justify-between border-b border-border px-3.5 py-3">
          <p className="font-heading text-sm font-semibold text-foreground">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
          >
            <CheckCheckIcon className="size-3.5" />
            Mark all read
          </Button>
        </div>
        <div className="scrollbar-thin max-h-96 overflow-y-auto">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={(n.href ?? "#") as Route}
              className={cn(
                "flex gap-3 border-b border-border px-3.5 py-3 last:border-b-0 hover:bg-muted/50",
                !n.read && "bg-primary/3"
              )}
            >
              <span
                className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", TYPE_DOT[n.type])}
              />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="border-t border-border p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs" render={<Link href="/communication/notifications" />}>
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { NotificationCenter }
