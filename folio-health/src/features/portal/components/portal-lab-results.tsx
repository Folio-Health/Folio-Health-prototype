"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { getPortalLabResultColumns } from "./portal-lab-results-columns"
import { LabResultViewDialog } from "./lab-result-view-dialog"
import { getPortalLabResults } from "@/lib/mock/portal"
import type { LabResult } from "@/lib/mock/laboratory"

function PortalLabResults() {
  const results = getPortalLabResults()
  const [viewing, setViewing] = useState<LabResult | null>(null)

  const columns = useMemo(
    () => getPortalLabResultColumns({ onView: (result) => setViewing(result) }),
    []
  )

  return (
    <div>
      <PageHeader title="Lab Results" description="Test results ordered by your care team" />

      <DataTable
        columns={columns}
        data={results}
        emptyTitle="No lab results yet"
        emptyDescription="Results from lab orders placed for you will appear here once available."
      />

      <LabResultViewDialog result={viewing} open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)} />
    </div>
  )
}

export { PortalLabResults }
