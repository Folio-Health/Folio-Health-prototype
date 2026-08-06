"use client"

import Link from "next/link"
import { BellIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/**
 * Notifications.
 *
 * This used to render a faker-generated list and a red unread badge — so the
 * bell permanently claimed "4 unread" next to real server data, which in a
 * clinical UI reads as four things needing attention. There is no notification
 * source on the FHIR server yet, so it shows an honest empty state and no
 * badge. Wire the badge back up when real notifications exist (Communication /
 * Task resources), not before.
 */
function NotificationCenter() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative" />
        }
      >
        <BellIcon className="size-4.5" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 gap-0 p-0">
        <div className="flex items-center justify-between border-b border-border px-3.5 py-3">
          <p className="font-heading text-sm font-semibold text-foreground">Notifications</p>
        </div>
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted">
            <BellIcon className="size-4 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
          <p className="text-xs text-muted-foreground">
            New notifications will appear here.
          </p>
        </div>
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            render={<Link href="/communication/notifications" />}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { NotificationCenter }
