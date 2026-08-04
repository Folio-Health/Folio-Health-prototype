"use client"

import { useState } from "react"
import { toast } from "sonner"
import { SaveIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { SettingsModuleTabs } from "./settings-module-tabs"

interface NotificationChannels {
  email: boolean
  sms: boolean
  push: boolean
}

const EVENT_TYPES: { id: string; label: string; description: string; defaults: NotificationChannels }[] = [
  {
    id: "new-appointment",
    label: "New Appointment",
    description: "When a new appointment is booked or assigned to you",
    defaults: { email: true, sms: true, push: true },
  },
  {
    id: "appointment-reminder",
    label: "Appointment Reminder",
    description: "Reminders ahead of scheduled visits",
    defaults: { email: true, sms: true, push: false },
  },
  {
    id: "lab-result-ready",
    label: "Lab Result Ready",
    description: "When a lab result has been reviewed and is ready",
    defaults: { email: true, sms: false, push: true },
  },
  {
    id: "prescription-dispensed",
    label: "Prescription Dispensed",
    description: "When a prescription has been dispensed by the pharmacy",
    defaults: { email: false, sms: true, push: true },
  },
  {
    id: "invoice-generated",
    label: "Invoice Generated",
    description: "When a new invoice is issued to a patient's account",
    defaults: { email: true, sms: false, push: false },
  },
  {
    id: "low-stock",
    label: "Low Stock Alert",
    description: "When pharmacy or inventory stock drops below reorder level",
    defaults: { email: true, sms: false, push: true },
  },
  {
    id: "shift-schedule",
    label: "Shift Schedule Updates",
    description: "Changes to staff shift assignments",
    defaults: { email: true, sms: false, push: false },
  },
  {
    id: "system-alerts",
    label: "System Alerts",
    description: "Critical system and security notifications",
    defaults: { email: true, sms: true, push: true },
  },
]

function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Record<string, NotificationChannels>>(() =>
    Object.fromEntries(EVENT_TYPES.map((e) => [e.id, e.defaults]))
  )

  function toggle(eventId: string, channel: keyof NotificationChannels) {
    setPrefs((prev) => ({
      ...prev,
      [eventId]: { ...prev[eventId], [channel]: !prev[eventId][channel] },
    }))
  }

  function handleSave() {
    toast.success("Notification preferences saved")
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure branding, appearance, and system preferences"
        breadcrumbs={[{ label: "System" }, { label: "Settings" }]}
      />

      <SettingsModuleTabs />

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you're notified for each type of event.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-6 gap-y-1 px-4 pb-2">
            <span />
            <span className="text-xs font-medium text-muted-foreground">Email</span>
            <span className="text-xs font-medium text-muted-foreground">SMS</span>
            <span className="text-xs font-medium text-muted-foreground">Push</span>
          </div>
          <div className="flex flex-col">
            {EVENT_TYPES.map((event) => (
              <div
                key={event.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-6 border-t border-border px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{event.label}</span>
                  <span className="text-xs text-muted-foreground">{event.description}</span>
                </div>
                <Switch checked={prefs[event.id].email} onCheckedChange={() => toggle(event.id, "email")} />
                <Switch checked={prefs[event.id].sms} onCheckedChange={() => toggle(event.id, "sms")} />
                <Switch checked={prefs[event.id].push} onCheckedChange={() => toggle(event.id, "push")} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-end">
        <Button size="lg" onClick={handleSave}>
          <SaveIcon />
          Save Changes
        </Button>
      </div>
    </div>
  )
}

export { NotificationPreferences }
