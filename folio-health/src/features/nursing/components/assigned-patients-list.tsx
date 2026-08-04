"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { UsersIcon, ListChecksIcon, PillIcon, ActivityIcon, SearchIcon } from "lucide-react"
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
import { NursingModuleTabs } from "./nursing-module-tabs"
import { getAssignedPatientsColumns, type AssignedPatientRow } from "./assigned-patients-columns"
import { NURSING_ASSIGNMENTS, NURSING_TASKS, MEDICATION_ORDERS } from "@/lib/mock/nursing"
import { getPatientById } from "@/lib/mock/patients"

const ALL = "all"

function AssignedPatientsList() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)

  const rows = useMemo<AssignedPatientRow[]>(() => {
    return NURSING_ASSIGNMENTS.map((assignment) => {
      const patient = getPatientById(assignment.patientId)
      return patient ? { assignment, patient } : null
    }).filter((r): r is AssignedPatientRow => r !== null)
  }, [])

  const filtered = useMemo(() => {
    return rows.filter(({ assignment, patient }) => {
      if (status !== ALL && assignment.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        if (!patient.name.toLowerCase().includes(q) && !patient.mrn.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [rows, search, status])

  const tasksPending = NURSING_TASKS.filter((t) => t.status !== "Done").length
  const medsDue = MEDICATION_ORDERS.filter((m) => m.status === "Pending").length
  const vitalsAlerts = NURSING_ASSIGNMENTS.filter((a) => a.status === "Critical").length

  const columns = getAssignedPatientsColumns({
    onRecordVitals: (row) =>
      toast.success(`Vitals recorded for ${row.patient.name}`, {
        description: "Latest readings have been logged to the patient's chart.",
      }),
  })

  return (
    <div>
      <PageHeader
        title="Nursing"
        description="Your assigned patients for the current shift"
        breadcrumbs={[{ label: "Clinical" }, { label: "Nursing" }]}
      />

      <NursingModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned Patients" value={rows.length} icon={UsersIcon} />
        <StatCard label="Tasks Pending" value={tasksPending} icon={ListChecksIcon} tone="amber" />
        <StatCard label="Medications Due" value={medsDue} icon={PillIcon} tone="violet" />
        <StatCard label="Vitals Alerts" value={vitalsAlerts} icon={ActivityIcon} tone="red" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No assigned patients found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by name or MRN..."
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
                <SelectItem value="Stable">Stable</SelectItem>
                <SelectItem value="Improving">Improving</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { AssignedPatientsList }
