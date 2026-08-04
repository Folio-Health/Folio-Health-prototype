"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { SearchIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { ObstetricsModuleTabs } from "./obstetrics-module-tabs"
import { getAntenatalColumns } from "./antenatal-columns"
import { ANTENATAL_VISITS, type AntenatalVisit } from "@/lib/mock/obstetrics"
import { getPatientById } from "@/lib/mock/patients"

function AntenatalVisits() {
  const [visits, setVisits] = useState<AntenatalVisit[]>(ANTENATAL_VISITS)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search) return visits
    const q = search.toLowerCase()
    return visits.filter((v) => getPatientById(v.patientId)?.name.toLowerCase().includes(q))
  }, [visits, search])

  function handleScheduleNext(visit: AntenatalVisit) {
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + 28)
    setVisits((prev) =>
      prev.map((v) => (v.id === visit.id ? { ...v, nextVisitDate: nextDate.toISOString() } : v))
    )
    const patient = getPatientById(visit.patientId)
    toast.success(`Next visit scheduled for ${patient?.name ?? "patient"}`, {
      description: `Follow-up set for ${nextDate.toLocaleDateString()}.`,
    })
  }

  const columns = getAntenatalColumns({ onScheduleNext: handleScheduleNext })

  return (
    <div>
      <PageHeader
        title="Antenatal Visits"
        description="Visit history and vitals for antenatal checkups"
        breadcrumbs={[{ label: "Clinical" }, { label: "Obstetrics", href: "/obstetrics" }, { label: "Antenatal Visits" }]}
      />

      <ObstetricsModuleTabs />

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No antenatal visits found"
        emptyDescription="Try adjusting your search terms."
        toolbar={
          <InputGroup className="h-9 max-w-xs">
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        }
      />
    </div>
  )
}

export { AntenatalVisits }
