"use client"

import { useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { SparklesIcon, XIcon, Maximize2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AssistantThread } from "@/features/assistant/components/assistant-thread"
import { AssistantComposer } from "@/features/assistant/components/assistant-composer"
import { SUGGESTED_PROMPTS, generateAssistantReply, type AssistantMessage } from "@/lib/mock/assistant"
import { id as makeId } from "@/lib/mock/seed"
import { useUiStore } from "@/stores/ui-store"

function AiAssistantLauncher() {
  const open = useUiStore((s) => s.aiAssistantOpen)
  const setOpen = useUiStore((s) => s.setAiAssistantOpen)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [isThinking, setIsThinking] = useState(false)

  function sendMessage(text: string) {
    const userMessage: AssistantMessage = {
      id: makeId("QASM", Date.now()),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsThinking(true)
    setTimeout(() => {
      const reply: AssistantMessage = {
        id: makeId("QASM", Date.now() + 1),
        role: "assistant",
        content: generateAssistantReply(text),
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, reply])
      setIsThinking(false)
    }, 900)
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed right-5 bottom-20 z-50 flex h-[520px] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <SparklesIcon className="size-3.5" />
                </span>
                <p className="font-heading text-sm font-semibold text-foreground">Folio Assistant</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" render={<Link href="/assistant" />} aria-label="Open full assistant">
                  <Maximize2Icon className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Close assistant">
                  <XIcon className="size-3.5" />
                </Button>
              </div>
            </div>

            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-5 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <SparklesIcon className="size-5" />
                </span>
                <p className="text-sm text-muted-foreground">
                  Ask a quick question about a patient, a task, or hospital operations.
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {SUGGESTED_PROMPTS.slice(0, 3).map((s) => (
                    <button
                      key={s.label}
                      onClick={() => sendMessage(s.prompt)}
                      className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <AssistantThread messages={messages} isThinking={isThinking} />
            )}

            <AssistantComposer onSend={sendMessage} disabled={isThinking} placeholder="Ask a quick question..." />
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        className="fixed right-5 bottom-5 z-50 size-12 rounded-full shadow-lg"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {open ? <XIcon className="size-5" /> : <SparklesIcon className="size-5" />}
      </Button>
    </>
  )
}

export { AiAssistantLauncher }
