"use client"

import { useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { AdministrationModuleTabs } from "./administration-module-tabs"

interface ConfigToggle {
  key: string
  label: string
  description: string
  defaultValue: boolean
}

interface ConfigGroup {
  category: string
  description: string
  toggles: ConfigToggle[]
}

const CONFIG_GROUPS: ConfigGroup[] = [
  {
    category: "Security",
    description: "Controls that protect accounts and sensitive data.",
    toggles: [
      {
        key: "twoFactor",
        label: "Require Two-Factor Authentication",
        description: "All staff must verify sign-in with a second factor.",
        defaultValue: true,
      },
      {
        key: "sessionTimeout",
        label: "Auto Sign-Out on Inactivity",
        description: "Automatically sign users out after 30 minutes of inactivity.",
        defaultValue: true,
      },
      {
        key: "maintenanceMode",
        label: "Maintenance Mode",
        description: "Temporarily restrict access to administrators only.",
        defaultValue: false,
      },
    ],
  },
  {
    category: "Features",
    description: "Toggle optional modules and workflows for the whole hospital.",
    toggles: [
      {
        key: "telehealth",
        label: "Enable Telehealth Appointments",
        description: "Allow doctors to conduct video consultations from Appointments.",
        defaultValue: true,
      },
      {
        key: "selfRegistration",
        label: "Allow Patient Self-Registration",
        description: "Let new patients register themselves from the patient portal.",
        defaultValue: false,
      },
      {
        key: "onlineBilling",
        label: "Enable Online Bill Payment",
        description: "Allow patients to pay outstanding invoices from the portal.",
        defaultValue: true,
      },
    ],
  },
  {
    category: "Notifications",
    description: "Automated communications sent on behalf of the hospital.",
    toggles: [
      {
        key: "smsNotifications",
        label: "Enable SMS Notifications",
        description: "Send appointment reminders and alerts via SMS.",
        defaultValue: true,
      },
      {
        key: "emailNotifications",
        label: "Enable Email Notifications",
        description: "Send billing receipts and confirmations via email.",
        defaultValue: true,
      },
      {
        key: "staffAlerts",
        label: "Enable Staff Shift Alerts",
        description: "Notify staff of upcoming or changed shift assignments.",
        defaultValue: false,
      },
    ],
  },
]

function buildInitialState() {
  const state: Record<string, boolean> = {}
  for (const group of CONFIG_GROUPS) {
    for (const toggle of group.toggles) {
      state[toggle.key] = toggle.defaultValue
    }
  }
  return state
}

function SystemConfiguration() {
  const [values, setValues] = useState<Record<string, boolean>>(buildInitialState)

  function handleToggle(toggle: ConfigToggle, next: boolean) {
    setValues((prev) => ({ ...prev, [toggle.key]: next }))
    toast.success(`${toggle.label} ${next ? "enabled" : "disabled"}`)
  }

  return (
    <div>
      <PageHeader
        title="System Configuration"
        description="Hospital-wide feature flags and security controls"
        breadcrumbs={[{ label: "System" }, { label: "Administration" }, { label: "System Configuration" }]}
      />

      <AdministrationModuleTabs />

      <div className="flex flex-col gap-4">
        {CONFIG_GROUPS.map((group) => (
          <Card key={group.category}>
            <CardHeader>
              <CardTitle>{group.category}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {group.toggles.map((toggle, i) => (
                <div key={toggle.key}>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{toggle.label}</span>
                      <span className="text-xs text-muted-foreground">{toggle.description}</span>
                    </div>
                    <Switch
                      checked={values[toggle.key]}
                      onCheckedChange={(checked) => handleToggle(toggle, !!checked)}
                    />
                  </div>
                  {i < group.toggles.length - 1 && <div className="h-px bg-border" />}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export { SystemConfiguration }
