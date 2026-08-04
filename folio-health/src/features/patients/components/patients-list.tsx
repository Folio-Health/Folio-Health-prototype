"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PlusIcon, DownloadIcon, SearchIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PATIENTS } from "@/lib/mock/patients"
import { patientsColumns } from "./patients-columns"
import type { Patient } from "@/types/core"
import { downloadCsv } from "@/lib/csv-export"

const ALL = "all"

function PatientsList() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [gender, setGender] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [ageRange, setAgeRange] = useState(ALL)

  const filtered = useMemo(() => {
    return PATIENTS.filter((p) => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.mrn.toLowerCase().includes(q) &&
          !p.phone.includes(q)
        ) {
          return false
        }
      }
      if (gender !== ALL && p.gender !== gender) return false
      if (status !== ALL && p.status !== status) return false
      if (ageRange !== ALL) {
        const [min, max] = ageRange.split("-").map(Number)
        if (p.age < min || (max && p.age > max)) return false
      }
      return true
    })
  }, [search, gender, status, ageRange])

  function handleExport() {
    downloadCsv(
      `patients-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((p) => ({
        MRN: p.mrn,
        Name: p.name,
        Age: p.age,
        Gender: p.gender,
        Phone: p.phone,
        Email: p.email,
        Status: p.status,
        "Last Visit": new Date(p.lastVisit).toLocaleDateString("en-US"),
      }))
    )
    toast.success(`Exported ${filtered.length} patients to CSV`)
  }

  return (
    <div>
      <PageHeader
        title="Patients"
        description={`${PATIENTS.length} patients registered`}
        breadcrumbs={[{ label: "Front Desk" }, { label: "Patients" }]}
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <DownloadIcon />
              Export
            </Button>
            <Button render={<Link href="/reception/register" />}>
              <PlusIcon />
              Add Patient
            </Button>
          </>
        }
      />

      <DataTable
        columns={patientsColumns}
        data={filtered as Patient[]}
        onRowClick={(patient) => router.push(`/patients/${patient.id}`)}
        emptyTitle="No patients found"
        emptyDescription="Try adjusting your search or filters, or register a new patient."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by name, MRN, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={gender} onValueChange={(v) => setGender(v ?? ALL)}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ageRange} onValueChange={(v) => setAgeRange(v ?? ALL)}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="Age Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Ages</SelectItem>
                <SelectItem value="0-12">0 to 12</SelectItem>
                <SelectItem value="13-19">13 to 19</SelectItem>
                <SelectItem value="20-39">20 to 39</SelectItem>
                <SelectItem value="40-59">40 to 59</SelectItem>
                <SelectItem value="60-120">60+</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { PatientsList }
