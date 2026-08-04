"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { SearchIcon, SyringeIcon, CheckCircle2Icon, ClockIcon, TriangleAlertIcon } from "lucide-react"
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
import { getVaccinationsColumns } from "./vaccinations-columns"
import { VACCINATIONS, type Vaccination } from "@/lib/mock/pediatrics"

const ALL = "all"

function VaccinationsList() {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>(VACCINATIONS)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)

  function handleMarkAdministered(vaccination: Vaccination) {
    setVaccinations((prev) =>
      prev.map((v) => (v.id === vaccination.id ? { ...v, status: "Completed" } : v))
    )
    toast.success(`${vaccination.vaccineName} marked as administered`)
  }

  const filtered = useMemo(() => {
    return vaccinations.filter((v) => {
      if (status !== ALL && v.status !== status) return false
      if (search && !v.vaccineName.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [vaccinations, search, status])

  const completed = vaccinations.filter((v) => v.status === "Completed").length
  const due = vaccinations.filter((v) => v.status === "Due").length
  const overdue = vaccinations.filter((v) => v.status === "Overdue").length

  const columns = getVaccinationsColumns({ onMarkAdministered: handleMarkAdministered })

  return (
    <div>
      <PageHeader
        title="Vaccination Tracker"
        description="Immunization schedule and status for pediatric patients"
        breadcrumbs={[{ label: "Clinical" }, { label: "Pediatrics", href: "/pediatrics" }, { label: "Vaccinations" }]}
      />

      <PediatricsModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Records" value={vaccinations.length} icon={SyringeIcon} />
        <StatCard label="Completed" value={completed} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Due" value={due} icon={ClockIcon} tone="amber" />
        <StatCard label="Overdue" value={overdue} icon={TriangleAlertIcon} tone="red" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No vaccination records found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by vaccine name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Due">Due</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { VaccinationsList }
