"use client"

import { useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { PlusIcon, SparklesIcon, Trash2Icon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AssistantThread } from "./assistant-thread"
import { AssistantComposer } from "./assistant-composer"
import {
  INITIAL_CONVERSATIONS,
  SUGGESTED_PROMPTS,
  generateAssistantReply,
  type AssistantConversation,
  type AssistantMessage,
} from "@/lib/mock/assistant"
import { id as makeId } from "@/lib/mock/seed"
import { useUiStore } from "@/stores/ui-store"
import { getStaffByRole } from "@/lib/mock/staff"

function AssistantWorkspace() {
  const [conversations, setConversations] = useState<AssistantConversation[]>(INITIAL_CONVERSATIONS)
  const [activeId, setActiveId] = useState<string | null>(INITIAL_CONVERSATIONS[0]?.id ?? null)
  const [isThinking, setIsThinking] = useState(false)
  const activeRole = useUiStore((s) => s.activeRole)
  const currentUser = getStaffByRole(activeRole)[0]

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  )

  function newConversation() {
    const conv: AssistantConversation = {
      id: makeId("CONV-NEW", conversations.length + 1),
      title: "New conversation",
      updatedAt: new Date().toISOString(),
      messages: [],
    }
    setConversations((prev) => [conv, ...prev])
    setActiveId(conv.id)
  }

  function deleteConversation(convId: string) {
    setConversations((prev) => prev.filter((c) => c.id !== convId))
    if (activeId === convId) setActiveId(null)
  }

  function sendMessage(text: string) {
    let targetId = activeId
    let baseConversations = conversations

    if (!targetId) {
      const conv: AssistantConversation = {
        id: makeId("CONV-NEW", conversations.length + 1),
        title: text.slice(0, 48),
        updatedAt: new Date().toISOString(),
        messages: [],
      }
      baseConversations = [conv, ...conversations]
      targetId = conv.id
      setActiveId(conv.id)
    }

    const userMessage: AssistantMessage = {
      id: makeId("ASM", Date.now()),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    }

    setConversations(
      baseConversations.map((c) =>
        c.id === targetId
          ? {
              ...c,
              title: c.messages.length === 0 ? text.slice(0, 48) : c.title,
              messages: [...c.messages, userMessage],
              updatedAt: userMessage.timestamp,
            }
          : c
      )
    )

    setIsThinking(true)
    setTimeout(() => {
      const replyMessage: AssistantMessage = {
        id: makeId("ASM", Date.now() + 1),
        role: "assistant",
        content: generateAssistantReply(text),
        timestamp: new Date().toISOString(),
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId
            ? { ...c, messages: [...c.messages, replyMessage], updatedAt: replyMessage.timestamp }
            : c
        )
      )
      setIsThinking(false)
    }, 900)
  }

  return (
    <div>
      <PageHeader
        title="AI Health Assistant"
        description="Ask about clinical reference material, hospital operations, or day to day tasks"
        breadcrumbs={[{ label: "Overview" }, { label: "AI Assistant" }]}
        actions={
          <Button onClick={newConversation}>
            <PlusIcon />
            New Conversation
          </Button>
        }
      />

      <div
        className="grid grid-cols-1 overflow-hidden rounded-xl border border-border md:grid-cols-[280px_1fr]"
        style={{ height: "min(75vh, 700px)" }}
      >
        <div className="flex flex-col border-b border-border md:border-r md:border-b-0">
          <div className="border-b border-border px-3 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Conversation history
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto">
            {conversations.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground">No conversations yet.</p>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "group flex w-full items-start justify-between gap-2 border-b border-border px-3 py-3 text-left transition-colors hover:bg-muted/50",
                  activeId === c.id && "bg-primary/5"
                )}
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-foreground">{c.title}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {c.messages.length === 0
                      ? "No messages yet"
                      : formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                  </span>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConversation(c.id)
                  }}
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete conversation"
                >
                  <Trash2Icon className="size-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {active && active.messages.length > 0 ? (
            <AssistantThread messages={active.messages} isThinking={isThinking} userName={currentUser?.name} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <SparklesIcon className="size-6" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="font-heading text-base font-semibold text-foreground">
                  How can I help with your shift?
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Ask a clinical question, check hospital operations, or get help drafting notes.
                </p>
              </div>
              <div className="flex max-w-xl flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => sendMessage(s.prompt)}
                    className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {isThinking && (
                <div className="flex items-center gap-1 rounded-xl bg-muted px-3 py-2.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          <AssistantComposer onSend={sendMessage} disabled={isThinking} />
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Folio Assistant can make mistakes. Always verify critical clinical information.
      </p>
    </div>
  )
}

export { AssistantWorkspace }
