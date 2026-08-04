"use client"

import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { PenSquareIcon, SearchIcon, SendIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { PersonAvatar } from "@/components/common/person-avatar"
import { EmptyState } from "@/components/common/empty-state"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { CommunicationModuleTabs } from "./communication-module-tabs"
import { EMAILS, type Email } from "@/lib/mock/communication"
import { cn } from "@/lib/utils"

function EmailCenter() {
  const [emails, setEmails] = useState<Email[]>(EMAILS)
  const [activeId, setActiveId] = useState<string>(EMAILS[0]?.id ?? "")
  const [search, setSearch] = useState("")
  const [composeOpen, setComposeOpen] = useState(false)
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")

  const active = emails.find((e) => e.id === activeId)
  const filtered = emails.filter((e) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return e.subject.toLowerCase().includes(q) || e.fromName.toLowerCase().includes(q)
  })

  function openEmail(id: string) {
    setActiveId(id)
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)))
  }

  function handleSend() {
    if (!to.trim() || !subject.trim()) {
      toast.error("Enter at least a recipient and a subject")
      return
    }
    toast.success(`Email sent to ${to.trim()}`, { description: subject.trim() })
    setTo("")
    setSubject("")
    setBody("")
    setComposeOpen(false)
  }

  return (
    <div>
      <PageHeader
        title="Email Center"
        description="Send and review hospital correspondence"
        breadcrumbs={[{ label: "Insights" }, { label: "Communication", href: "/communication" }, { label: "Email" }]}
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setComposeOpen(true)}>
            <PenSquareIcon className="size-3.5" />
            Compose
          </Button>
        }
      />

      <CommunicationModuleTabs />

      <div
        className="grid grid-cols-1 overflow-hidden rounded-xl border border-border md:grid-cols-[340px_1fr]"
        style={{ height: "min(70vh, 640px)" }}
      >
        <div className="hidden flex-col border-border md:flex md:border-r">
          <div className="border-b border-border p-3">
            <InputGroup className="h-8">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">No emails match your search.</p>
            )}
            {filtered.map((e) => (
              <button
                key={e.id}
                onClick={() => openEmail(e.id)}
                className={cn(
                  "flex w-full flex-col gap-1 border-b border-border px-3.5 py-3 text-left transition-colors hover:bg-muted/50",
                  active?.id === e.id && "bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("truncate text-sm", !e.read ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                    {e.fromName}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {format(new Date(e.receivedAt), "dd MMM")}
                  </span>
                </div>
                <span className={cn("truncate text-sm", !e.read ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {e.subject}
                </span>
                <span className="truncate text-xs text-muted-foreground">{e.preview}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col overflow-y-auto">
          {active ? (
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PersonAvatar name={active.fromName} size="default" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{active.fromName}</span>
                    <span className="text-xs text-muted-foreground">{active.fromEmail}</span>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {format(new Date(active.receivedAt), "dd MMM yyyy, h:mm a")}
                </span>
              </div>
              <h2 className="font-heading text-lg font-semibold text-foreground">{active.subject}</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">{active.body}</p>
            </div>
          ) : (
            <EmptyState className="m-4 flex-1 border-0" title="No email selected" description="Choose an email from the list to read it." />
          )}
        </div>
      </div>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
            <DialogDescription>This is a local draft, sending will not deliver a real email.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="compose-to">To</Label>
              <Input id="compose-to" placeholder="recipient@foliohealth.example" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="compose-subject">Subject</Label>
              <Input id="compose-subject" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="compose-body">Message</Label>
              <Textarea id="compose-body" placeholder="Write your message..." rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Discard
            </Button>
            <Button className="gap-1.5" onClick={handleSend}>
              <SendIcon className="size-3.5" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { EmailCenter }
