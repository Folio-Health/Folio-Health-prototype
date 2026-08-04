"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { PlusIcon, TicketIcon, TriangleAlertIcon, CheckCircle2Icon, SearchIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { CommunicationModuleTabs } from "./communication-module-tabs"
import { getTicketColumns } from "./tickets-columns"
import { TICKETS, type SupportTicket, type TicketPriority } from "@/lib/mock/communication"

const PRIORITIES: TicketPriority[] = ["Low", "Medium", "High", "Urgent"]
const CATEGORIES = ["IT Support", "Facilities", "Biomedical", "Security", "Other"]

function TicketsList() {
  const [tickets, setTickets] = useState<SupportTicket[]>(TICKETS)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState(CATEGORIES[0])
  const [priority, setPriority] = useState<TicketPriority>("Medium")

  const openCount = tickets.filter((t) => t.status === "Open").length
  const urgentCount = tickets.filter((t) => t.priority === "Urgent" && t.status !== "Resolved" && t.status !== "Closed").length
  const resolvedCount = tickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tickets
    return tickets.filter(
      (t) => t.subject.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.requesterName.toLowerCase().includes(q)
    )
  }, [tickets, search])

  function handleResolve(ticket: SupportTicket) {
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status: "Resolved" } : t)))
    toast.success(`${ticket.id} marked as resolved`)
  }

  function handleAssignToMe(ticket: SupportTicket) {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id ? { ...t, assignedToName: "You", status: t.status === "Open" ? "In Progress" : t.status } : t
      )
    )
    toast.success(`${ticket.id} assigned to you`)
  }

  function resetForm() {
    setSubject("")
    setCategory(CATEGORIES[0])
    setPriority("Medium")
  }

  function handleCreate() {
    if (!subject.trim()) {
      toast.error("Enter a subject for the ticket")
      return
    }
    const newTicket: SupportTicket = {
      id: `TKT-local-${Date.now()}`,
      subject: subject.trim(),
      category,
      requesterId: "me",
      requesterName: "You",
      priority,
      status: "Open",
      createdAt: new Date().toISOString(),
    }
    setTickets((prev) => [newTicket, ...prev])
    toast.success("Ticket submitted")
    resetForm()
    setOpen(false)
  }

  const columns = getTicketColumns({ onResolve: handleResolve, onAssignToMe: handleAssignToMe })

  return (
    <div>
      <PageHeader
        title="Support Tickets"
        description="Track IT, facilities, and biomedical support requests"
        breadcrumbs={[
          { label: "Insights" },
          { label: "Communication", href: "/communication" },
          { label: "Support Tickets" },
        ]}
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <PlusIcon className="size-3.5" />
            New Ticket
          </Button>
        }
      />

      <CommunicationModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Open Tickets" value={openCount} icon={TicketIcon} />
        <StatCard label="Urgent / Unresolved" value={urgentCount} icon={TriangleAlertIcon} tone="red" />
        <StatCard label="Resolved / Closed" value={resolvedCount} icon={CheckCircle2Icon} tone="emerald" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No support tickets"
        emptyDescription="Tickets you submit or that are assigned to your team will appear here."
        toolbar={
          <InputGroup className="h-9 max-w-xs">
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by ID, subject, or requester..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Support Ticket</DialogTitle>
            <DialogDescription>Submit a request to IT, facilities, or biomedical support.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ticket-subject">Subject</Label>
              <Input
                id="ticket-subject"
                placeholder="e.g. Workstation won't turn on"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ticket-category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v ?? CATEGORIES[0])}>
                  <SelectTrigger id="ticket-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ticket-priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority((v as TicketPriority) ?? "Medium")}>
                  <SelectTrigger id="ticket-priority" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Submit Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { TicketsList }
