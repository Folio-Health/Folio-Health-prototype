"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { SendIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PORTAL_MESSAGES, getPortalDoctor, type PortalMessage } from "@/lib/mock/portal"
import { cn } from "@/lib/utils"

function PortalMessages() {
  const [messages, setMessages] = useState<PortalMessage[]>(PORTAL_MESSAGES)
  const [draft, setDraft] = useState("")
  const doctor = getPortalDoctor()

  useEffect(() => {
    // Opening the thread marks any inbound messages as read.
    setMessages((prev) => prev.map((m) => (m.fromMe ? m : { ...m, read: true })))
  }, [])

  function handleSend() {
    if (!draft.trim()) return
    const message: PortalMessage = {
      id: `PMSG-local-${Date.now()}`,
      fromMe: true,
      senderName: "You",
      senderRole: "Patient",
      body: draft.trim(),
      sentAt: new Date().toISOString(),
      read: true,
    }
    setMessages((prev) => [...prev, message])
    setDraft("")
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Message the front desk or your care team directly"
      />

      <div
        className="flex flex-col overflow-hidden rounded-xl border border-border"
        style={{ height: "min(70vh, 600px)" }}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <PersonAvatar name={doctor?.name ?? "Care Team"} seed={doctor?.avatarSeed} size="sm" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {doctor?.name ?? "Care Team"} &amp; Front Desk
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Usually replies within a few hours
            </span>
          </div>
        </div>

        <div className="scrollbar-thin flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex flex-col gap-1", m.fromMe ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-xl px-3 py-2 text-sm break-words",
                  m.fromMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}
              >
                {m.body}
              </div>
              <span className="px-1 text-[11px] text-muted-foreground">
                {m.fromMe ? "You" : m.senderName} &middot; {format(new Date(m.sentAt), "MMM d, h:mm a")}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-border p-3">
          <Input
            placeholder="Type a message..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSend()
              }
            }}
            className="h-9"
          />
          <Button size="icon" onClick={handleSend} aria-label="Send message" disabled={!draft.trim()}>
            <SendIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { PortalMessages }
