"use client"

import { useMemo, useState } from "react"
import { ActivityIcon, SearchIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdministrationModuleTabs } from "./administration-module-tabs"
import { activityLogsColumns } from "./activity-logs-columns"
import { ACTIVITY_LOGS } from "@/lib/mock/administration"
import { getStaffById } from "@/lib/mock/staff"

const ALL = "all"

function ActivityLogsList() {
  const [search, setSearch] = useState("")
  const [module, setModule] = useState(ALL)

  const modules = useMemo(() => Array.from(new Set(ACTIVITY_LOGS.map((l) => l.module))).sort(), [])

  const filtered = useMemo(() => {
    return ACTIVITY_LOGS.filter((log) => {
      if (module !== ALL && log.module !== module) return false
      if (search) {
        const q = search.toLowerCase()
        const staff = getStaffById(log.staffId)
        if (!staff?.name.toLowerCase().includes(q) && !log.activity.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [search, module])

  return (
    <div>
      <PageHeader
        title="Activity Logs"
        description="A lightweight feed of everyday user activity across the platform"
        breadcrumbs={[{ label: "System" }, { label: "Administration" }, { label: "Activity Logs" }]}
      />

      <AdministrationModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Activities" value={ACTIVITY_LOGS.length} icon={ActivityIcon} />
        <StatCard label="Modules Touched" value={modules.length} icon={ActivityIcon} tone="violet" />
      </div>

      <DataTable
        columns={activityLogsColumns}
        data={filtered}
        emptyTitle="No activity found"
        emptyDescription="Try adjusting your search or module filter."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by user or activity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={module} onValueChange={(v) => setModule(v ?? ALL)}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Modules</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { ActivityLogsList }
