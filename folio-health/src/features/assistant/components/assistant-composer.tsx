"use client"

import { useState } from "react"
import { SendIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function AssistantComposer({
  onSend,
  disabled,
  placeholder = "Ask about a patient, a task, or hospital operations...",
}: {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [draft, setDraft] = useState("")

  function handleSend() {
    const trimmed = draft.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setDraft("")
  }

  return (
    <div className="flex items-center gap-2 border-t border-border p-3">
      <Input
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
          }
        }}
        className="h-9"
        disabled={disabled}
      />
      <Button size="icon" onClick={handleSend} aria-label="Send message" disabled={disabled || !draft.trim()}>
        <SendIcon className="size-4" />
      </Button>
    </div>
  )
}

export { AssistantComposer }
