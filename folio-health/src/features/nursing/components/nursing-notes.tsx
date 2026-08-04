"use client"

import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { NursingModuleTabs } from "./nursing-module-tabs"
import { nursingNotesColumns } from "./nursing-notes-columns"
import { NURSING_NOTES } from "@/lib/mock/nursing"
import { getPatientById } from "@/lib/mock/patients"

function NursingNotes() {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search) return NURSING_NOTES
    const q = search.toLowerCase()
    return NURSING_NOTES.filter((n) => {
      const patient = getPatientById(n.patientId)
      return n.note.toLowerCase().includes(q) || patient?.name.toLowerCase().includes(q)
    })
  }, [search])

  return (
    <div>
      <PageHeader
        title="Nursing Notes"
        description="Clinical notes recorded by nursing staff across all patients"
        breadcrumbs={[{ label: "Clinical" }, { label: "Nursing", href: "/nursing" }, { label: "Notes" }]}
      />

      <NursingModuleTabs />

      <DataTable
        columns={nursingNotesColumns}
        data={filtered}
        emptyTitle="No nursing notes found"
        emptyDescription="Try adjusting your search terms."
        toolbar={
          <InputGroup className="h-9 max-w-xs">
            <InputGroupAddon>
              <SearchIcon className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by patient or note text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        }
      />
    </div>
  )
}

export { NursingNotes }
