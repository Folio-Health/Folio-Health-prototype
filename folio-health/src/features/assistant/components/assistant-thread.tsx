"use client"

import { useEffect, useRef } from "react"
import { format } from "date-fns"
import { SparklesIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AssistantMessage } from "@/lib/mock/assistant"

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-muted px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

function AssistantThread({
  messages,
  isThinking,
  userName,
}: {
  messages: AssistantMessage[]
  isThinking?: boolean
  userName?: string
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages.length, isThinking])

  return (
    <div className="scrollbar-thin flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {messages.map((m) => {
        const isAssistant = m.role === "assistant"
        return (
          <div key={m.id} className={cn("flex items-start gap-2.5", isAssistant ? "flex-row" : "flex-row-reverse")}>
            {isAssistant && (
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <SparklesIcon className="size-3.5" />
              </span>
            )}
            <div className={cn("flex max-w-[80%] flex-col gap-1", isAssistant ? "items-start" : "items-end")}>
              <div
                className={cn(
                  "rounded-xl px-3 py-2 text-sm break-words whitespace-pre-line",
                  isAssistant ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                )}
              >
                {m.content}
              </div>
              <span className="px-1 text-[11px] text-muted-foreground">
                {isAssistant ? "Folio Assistant" : (userName ?? "You")} &middot; {format(new Date(m.timestamp), "h:mm a")}
              </span>
            </div>
          </div>
        )
      })}
      {isThinking && (
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <SparklesIcon className="size-3.5" />
          </span>
          <TypingIndicator />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

export { AssistantThread }
