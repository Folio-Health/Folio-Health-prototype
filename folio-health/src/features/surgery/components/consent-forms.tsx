"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { FileSignatureIcon, CheckCircle2Icon, HourglassIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { getPatientById } from "@/lib/mock/patients"
import { CONSENT_FORMS_LIST } from "@/lib/mock/surgery"
import type { ConsentForm } from "@/lib/mock/surgery"
import { consentFormsColumns } from "./consent-forms-columns"

function ConsentForms() {
  const [viewing, setViewing] = useState<ConsentForm | null>(null)

  const rows = useMemo(
    () => [...CONSENT_FORMS_LIST].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    []
  )
  const signedCount = rows.filter((f) => f.signed).length
  const pendingCount = rows.length - signedCount

  function handlePrint(form: ConsentForm) {
    const patient = getPatientById(form.patientId)
    toast.success("Sending consent form to printer...", { description: patient?.name })
  }

  const columns = useMemo(() => consentFormsColumns((f) => setViewing(f), handlePrint), [])

  const viewingPatient = viewing ? getPatientById(viewing.patientId) : undefined

  return (
    <div>
      <PageHeader
        title="Consent Forms"
        description={`${rows.length} surgical consent forms on file`}
        breadcrumbs={[{ label: "Surgery" }, { label: "Consent Forms" }]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Forms" value={rows.length} icon={FileSignatureIcon} />
        <StatCard label="Signed" value={signedCount} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Pending Signature" value={pendingCount} icon={HourglassIcon} tone="amber" />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        onRowClick={(form) => setViewing(form)}
        emptyTitle="No consent forms found"
        emptyDescription="Consent forms generated for scheduled procedures will appear here."
      />

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.procedure}</DialogTitle>
            <DialogDescription>
              {viewingPatient?.name} &middot; {viewing && format(new Date(viewing.date), "MMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 text-sm">
            <p className="text-muted-foreground">{viewing?.risks}</p>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={viewing?.signed ? "Signed" : "Pending"} />
            </div>
            {viewing?.signed && (
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-muted-foreground">Signed By</span>
                <span className="text-foreground">{viewing.signedBy}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={!viewing?.signed}
              onClick={() => viewing && handlePrint(viewing)}
            >
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { ConsentForms }
