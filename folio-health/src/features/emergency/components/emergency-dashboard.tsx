"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { SearchIcon, ActivityIcon, TriangleAlertIcon, HourglassIcon, ClockIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useErCases } from "../hooks/use-emergency"
import { emergencyColumns } from "./emergency-columns"

const ALL = "all"

function EmergencyDashboard() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)

  // Includes closed cases: the dashboard is the day's picture, not just who is
  // still in the department.
  const { data: cases = [], isLoading, isError } = useErCases(true)

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (status !== ALL && c.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !c.chiefComplaint.toLowerCase().includes(q) &&
          !(c.patientName?.toLowerCase().includes(q) ?? false)
        ) {
          return false
        }
      }
      return true
    })
  }, [cases, search, status])

  const averageWaitMinutes = useMemo(() => {
    const waiting = cases.filter((c) => c.status === "Waiting" && c.arrivalTime)
    if (waiting.length === 0) return 0
    const total = waiting.reduce(
      (sum, c) => sum + (Date.now() - new Date(c.arrivalTime).getTime()) / 60000,
      0
    )
    return Math.round(total / waiting.length)
  }, [cases])

  return (
    <div>
      <PageHeader
        title="Emergency Dashboard"
        description={isLoading ? "Loading..." : `${cases.length} cases on record`}
        breadcrumbs={[{ label: "Emergency" }]}
        actions={
          <>
            <Button variant="outline" render={<Link href="/emergency/triage" />}>
              Triage Queue
            </Button>
            <Button render={<Link href="/emergency/ambulance" />}>Ambulance Tracking</Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Cases" value={cases.filter((c) => c.status === "Waiting" || c.status === "In Treatment").length} icon={ActivityIcon} />
        <StatCard label="Critical" value={cases.filter((c) => c.triageLevel <= 2 && c.status !== "Discharged").length} icon={TriangleAlertIcon} tone="red" />
        <StatCard
          label="Waiting"
          value={cases.filter((c) => c.status === "Waiting").length}
          icon={HourglassIcon}
          tone="amber"
        />
        <StatCard label="Avg Wait Time" // Mean wait for patients still waiting, computed from arrival times.
          value={`${averageWaitMinutes}m`} icon={ClockIcon} tone="violet" />
      </div>

      <DataTable
        columns={emergencyColumns}
        data={filtered}
        isLoading={isLoading}
        emptyTitle={isError ? "Could not load ER cases" : "No ER cases found"}
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by patient or complaint..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="Waiting">Waiting</SelectItem>
                <SelectItem value="In Treatment">In Treatment</SelectItem>
                <SelectItem value="Admitted">Admitted</SelectItem>
                <SelectItem value="Discharged">Discharged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        pageSize={10}
      />
    </div>
  )
}

export { EmergencyDashboard }
