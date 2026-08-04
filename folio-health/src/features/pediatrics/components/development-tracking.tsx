"use client"

import { useMemo, useState } from "react"
import { SearchIcon, BrainIcon, CheckCircle2Icon, TriangleAlertIcon, ClockIcon } from "lucide-react"
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
import { PediatricsModuleTabs } from "./pediatrics-module-tabs"
import { developmentColumns } from "./development-columns"
import { DEVELOPMENT_MILESTONES } from "@/lib/mock/pediatrics"

const ALL = "all"

function DevelopmentTracking() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState(ALL)

  const filtered = useMemo(() => {
    return DEVELOPMENT_MILESTONES.filter((d) => {
      if (category !== ALL && d.category !== category) return false
      if (search && !d.milestone.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [search, category])

  const achieved = DEVELOPMENT_MILESTONES.filter((d) => d.status === "Achieved").length
  const delayed = DEVELOPMENT_MILESTONES.filter((d) => d.status === "Delayed").length
  const pending = DEVELOPMENT_MILESTONES.filter((d) => d.status === "Pending").length

  return (
    <div>
      <PageHeader
        title="Development Tracking"
        description="Motor, language, social, and cognitive milestones by patient"
        breadcrumbs={[{ label: "Clinical" }, { label: "Pediatrics", href: "/pediatrics" }, { label: "Development" }]}
      />

      <PediatricsModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Milestones" value={DEVELOPMENT_MILESTONES.length} icon={BrainIcon} />
        <StatCard label="Achieved" value={achieved} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Pending" value={pending} icon={ClockIcon} tone="amber" />
        <StatCard label="Delayed" value={delayed} icon={TriangleAlertIcon} tone="red" />
      </div>

      <DataTable
        columns={developmentColumns}
        data={filtered}
        emptyTitle="No milestones found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search milestones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={category} onValueChange={(v) => setCategory(v ?? ALL)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Categories</SelectItem>
                <SelectItem value="Motor">Motor</SelectItem>
                <SelectItem value="Language">Language</SelectItem>
                <SelectItem value="Social">Social</SelectItem>
                <SelectItem value="Cognitive">Cognitive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { DevelopmentTracking }
