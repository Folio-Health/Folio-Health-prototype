"use client"

import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { PlusIcon, MegaphoneIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { EmptyState } from "@/components/common/empty-state"
import { CommunicationModuleTabs } from "./communication-module-tabs"
import { ANNOUNCEMENTS, type Announcement, type AnnouncementAudience } from "@/lib/mock/communication"

const AUDIENCES: AnnouncementAudience[] = ["All Staff", "Doctors", "Nurses", "Administration", "Pharmacy"]

function AnnouncementsList() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(ANNOUNCEMENTS)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [audience, setAudience] = useState<AnnouncementAudience>("All Staff")

  function resetForm() {
    setTitle("")
    setBody("")
    setAudience("All Staff")
  }

  function handleCreate() {
    if (!title.trim() || !body.trim()) {
      toast.error("Please enter a title and a message body")
      return
    }
    const newAnnouncement: Announcement = {
      id: `ANN-local-${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      postedBy: "You",
      postedByRole: "Administrator",
      audience,
      postedAt: new Date().toISOString(),
    }
    setAnnouncements((prev) => [newAnnouncement, ...prev])
    toast.success("Announcement posted")
    resetForm()
    setOpen(false)
  }

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Hospitalwide notices shared across departments"
        breadcrumbs={[
          { label: "Insights" },
          { label: "Communication", href: "/communication" },
          { label: "Announcements" },
        ]}
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <PlusIcon className="size-3.5" />
            New Announcement
          </Button>
        }
      />

      <CommunicationModuleTabs />

      {announcements.length === 0 ? (
        <EmptyState
          icon={MegaphoneIcon}
          title="No announcements yet"
          description="Post your first hospitalwide announcement to get started."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-heading text-base font-medium text-foreground">{a.title}</h3>
                  <Badge variant="outline">{a.audience}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Posted by {a.postedBy} ({a.postedByRole}) &middot; {format(new Date(a.postedAt), "dd MMM yyyy, h:mm a")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
            <DialogDescription>Share a hospital-wide or department-specific notice.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                placeholder="e.g. Updated visiting hours"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="announcement-body">Message</Label>
              <Textarea
                id="announcement-body"
                placeholder="Write the announcement details..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="announcement-audience">Audience</Label>
              <Select
                value={audience}
                onValueChange={(v) => setAudience((v as AnnouncementAudience) ?? "All Staff")}
              >
                <SelectTrigger id="announcement-audience" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Post Announcement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { AnnouncementsList }
