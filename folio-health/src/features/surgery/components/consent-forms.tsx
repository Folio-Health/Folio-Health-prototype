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
import type { ConsentForm } from "@/lib/mock/surgery"
import { useConsentForms, useSignConsent } from "../hooks/use-surgery"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { consentFormsColumns } from "./consent-forms-columns"

function ConsentForms() {
  const [viewing, setViewing] = useState<ConsentForm | null>(null)

  const { data: forms = [], isLoading, isError } = useConsentForms()
  const signConsentForm = useSignConsent()
  const { data: user } = useCurrentUser()

  const rows = useMemo(
    () => [...forms].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [forms]
  )
  const signedCount = rows.filter((f) => f.signed).length
  const pendingCount = rows.length - signedCount

  function handlePrint(form: ConsentForm) {
    toast.success("Sending consent form to printer...", { description: form.procedure })
  }

  /**
   * Record that the patient signed.
   *
   * Deliberately an explicit action rather than something the form does when it
   * is created: a form existing is not a patient having agreed.
   */
  async function handleSign(form: ConsentForm) {
    try {
      await signConsentForm.mutateAsync({
        consentId: form.id,
        signedBy: user?.name ?? "Signed-in clinician",
      })
      toast.success("Consent recorded", { description: `${form.procedure} consent is now signed.` })
      setViewing(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record the consent")
    }
  }

  const columns = useMemo(
    () => consentFormsColumns((f) => setViewing(f), handlePrint),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

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
        isLoading={isLoading}
        onRowClick={(form) => setViewing(form)}
        emptyTitle={isError ? "Could not load consent forms" : "No consent forms found"}
        emptyDescription="Consent forms generated for scheduled procedures will appear here."
      />

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.procedure}</DialogTitle>
            <DialogDescription>
              {viewing && format(new Date(viewing.date), "MMM d, yyyy")}
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
            {/* Only offered while unsigned — consent is given once. */}
            {viewing && !viewing.signed && (
              <Button
                disabled={signConsentForm.isPending}
                onClick={() => handleSign(viewing)}
              >
                Record signature
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { ConsentForms }
