"use client"

import { useState } from "react"
import { toast } from "sonner"
import { SaveIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SettingsModuleTabs } from "./settings-module-tabs"

const LANGUAGES = ["English (US)", "English (UK)", "French", "Portuguese", "Hausa", "Yoruba", "Igbo"]
const TIMEZONES = [
  "(GMT+01:00) West Africa Time, Lagos",
  "(GMT+00:00) Greenwich Mean Time, London",
  "(GMT-05:00) Eastern Time, New York",
  "(GMT+03:00) East Africa Time, Nairobi",
]
const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]
const CURRENCIES = ["NGN (₦), Nigerian Naira", "USD ($), US Dollar", "GBP (£), British Pound", "EUR (€), Euro"]

function LocalizationSettings() {
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [timezone, setTimezone] = useState(TIMEZONES[0])
  const [dateFormat, setDateFormat] = useState(DATE_FORMATS[0])
  const [currency, setCurrency] = useState(CURRENCIES[0])

  function handleSave() {
    toast.success("Localization preferences saved")
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
          <CardTitle>Localization</CardTitle>
          <CardDescription>Set the default language, timezone, and formats used across the platform.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Language</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v ?? LANGUAGES[0])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={(v) => setTimezone(v ?? TIMEZONES[0])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Date Format</Label>
            <Select value={dateFormat} onValueChange={(v) => setDateFormat(v ?? DATE_FORMATS[0])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v ?? CURRENCIES[0])}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

export { LocalizationSettings }
