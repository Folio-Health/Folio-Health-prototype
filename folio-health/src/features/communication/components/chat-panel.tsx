"use client"

import { useState } from "react"
import { format, formatDistanceToNowStrict } from "date-fns"
import { SearchIcon, SendIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { EmptyState } from "@/components/common/empty-state"
import { CommunicationModuleTabs } from "./communication-module-tabs"
import { CHAT_CONVERSATIONS, type ChatConversation, type ChatMessage } from "@/lib/mock/communication"
import { cn } from "@/lib/utils"

function ChatPanel() {
  const [conversations, setConversations] = useState<ChatConversation[]>(CHAT_CONVERSATIONS)
  const [activeId, setActiveId] = useState<string>(CHAT_CONVERSATIONS[0]?.id ?? "")
  const [draft, setDraft] = useState("")
  const [search, setSearch] = useState("")

  const active = conversations.find((c) => c.id === activeId)
  const filtered = conversations.filter((c) =>
    c.staff.name.toLowerCase().includes(search.trim().toLowerCase())
  )

  function selectConversation(id: string) {
    setActiveId(id)
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)))
  }

  function handleSend() {
    if (!draft.trim() || !active) return
    const message: ChatMessage = {
      id: `${active.id}-local-${Date.now()}`,
      fromMe: true,
      senderName: "You",
      body: draft.trim(),
      sentAt: new Date().toISOString(),
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, message] } : c))
    )
    setDraft("")
  }

  return (
    <div>
      <PageHeader
        title="Internal Chat"
        description="Message staff across departments in real time"
        breadcrumbs={[{ label: "Insights" }, { label: "Communication", href: "/communication" }, { label: "Chat" }]}
      />

      <CommunicationModuleTabs />

      <div
        className="grid grid-cols-1 overflow-hidden rounded-xl border border-border md:grid-cols-[300px_1fr]"
        style={{ height: "min(70vh, 640px)" }}
      >
        <div className="hidden flex-col border-border md:flex md:border-r">
          <div className="border-b border-border p-3">
            <InputGroup className="h-8">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">No conversations match your search.</p>
            )}
            {filtered.map((c) => {
              const last = c.messages[c.messages.length - 1]
              return (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 border-b border-border px-3 py-3 text-left transition-colors hover:bg-muted/50",
                    active?.id === c.id && "bg-primary/5"
                  )}
                >
                  <PersonAvatar name={c.staff.name} seed={c.staff.avatarSeed} size="sm" />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{c.staff.name}</span>
                      {last && (
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatDistanceToNowStrict(new Date(last.sentAt))}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{last?.body}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col">
          {active ? (
            <>
              <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
                <PersonAvatar name={active.staff.name} seed={active.staff.avatarSeed} size="sm" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">{active.staff.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {active.staff.title} &middot; {active.staff.department}
                  </span>
                </div>
              </div>
              <div className="scrollbar-thin flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                {active.messages.map((m) => (
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
                      {m.fromMe ? "You" : m.senderName} &middot; {format(new Date(m.sentAt), "h:mm a")}
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
            </>
          ) : (
            <EmptyState
              className="m-4 flex-1 border-0"
              title="No conversation selected"
              description="Choose a conversation from the list to start chatting."
            />
          )}
        </div>
      </div>
    </div>
  )
}

export { ChatPanel }
