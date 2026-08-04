"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BabyIcon, SyringeIcon, TriangleAlertIcon, LineChartIcon, SearchIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { PediatricsModuleTabs } from "./pediatrics-module-tabs"
import { pediatricsColumns } from "./pediatrics-columns"
import { PEDIATRIC_PATIENTS, VACCINATIONS, DEVELOPMENT_MILESTONES } from "@/lib/mock/pediatrics"

function PediatricsOverview() {
  const router = useRouter()
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search) return PEDIATRIC_PATIENTS
    const q = search.toLowerCase()
    return PEDIATRIC_PATIENTS.filter((p) => p.name.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q))
  }, [search])

  const vaccinationsDue = VACCINATIONS.filter((v) => v.status === "Due").length
  const vaccinationsOverdue = VACCINATIONS.filter((v) => v.status === "Overdue").length
  const developmentDelays = DEVELOPMENT_MILESTONES.filter((d) => d.status === "Delayed").length

  return (
    <div>
      <PageHeader
        title="Pediatrics"
        description="Growth, immunization, and development tracking for pediatric patients"
        breadcrumbs={[{ label: "Clinical" }, { label: "Pediatrics" }]}
      />

      <PediatricsModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pediatric Patients" value={PEDIATRIC_PATIENTS.length} icon={BabyIcon} />
        <StatCard label="Vaccinations Due" value={vaccinationsDue} icon={SyringeIcon} tone="amber" />
        <StatCard label="Vaccinations Overdue" value={vaccinationsOverdue} icon={TriangleAlertIcon} tone="red" />
        <StatCard label="Development Delays" value={developmentDelays} icon={LineChartIcon} tone="violet" />
      </div>

      <DataTable
        columns={pediatricsColumns}
        data={filtered}
        onRowClick={(patient) => router.push(`/patients/${patient.id}`)}
        emptyTitle="No pediatric patients found"
        emptyDescription="Try adjusting your search terms."
        toolbar={
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
        }
      />
    </div>
  )
}

export { PediatricsOverview }
