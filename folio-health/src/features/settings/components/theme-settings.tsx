"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { SunIcon, MoonIcon, MonitorIcon, CheckIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SettingsModuleTabs } from "./settings-module-tabs"
import { cn } from "@/lib/utils"

const THEME_OPTIONS = [
  { value: "light", label: "Light", description: "Bright interface for daytime use", icon: SunIcon },
  { value: "dark", label: "Dark", description: "Easier on the eyes in low light", icon: MoonIcon },
  { value: "system", label: "System", description: "Match your device's setting", icon: MonitorIcon },
] as const

function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

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
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how Folio Health EMR looks on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {THEME_OPTIONS.map((option) => {
              const isActive = mounted && theme === option.value
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors",
                    isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  )}
                >
                  {isActive && (
                    <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon className="size-3" />
                    </span>
                  )}
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4.5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { ThemeSettings }
