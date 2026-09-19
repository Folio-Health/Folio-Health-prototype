"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  HistoryIcon,
  Loader2Icon,
  MessageCircleQuestionIcon,
  PillIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"
import type { MedicationRequest } from "@medplum/fhirtypes"
import { PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { EmptyState } from "@/components/common/empty-state"
import { ListSkeleton } from "@/components/common/loading-skeletons"
import { RoleGate } from "@/components/common/role-gate"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  useDispense,
  usePatientMedicationHistory,
  usePrescriptionQueue,
} from "@/features/clinical/hooks/use-clinical"
import { QueryOrderDialog } from "@/features/orders/components/query-order-dialog"

/**
 * The pharmacy queue: active prescriptions written by doctors, oldest
 * first. Before dispensing, the pharmacist opens the patient's medication
 * history — every prescription and dispense on record, plus allergies —
 * which is the pharmacist's own access, not the full chart. Dispensing
 * writes a MedicationDispense and completes the prescription (closed-loop
 * medication, emr-clinical-flows.md §3).
 */
function PharmacyList() {
  const { data: queue, isPending } = usePrescriptionQueue()
  const [historyFor, setHistoryFor] = useState<MedicationRequest | null>(null)
  const [dispensing, setDispensing] = useState<MedicationRequest | null>(null)

  return (
    <div>
      <PageHeader
        title="Pharmacy"
        description="Prescriptions waiting to be dispensed — check the medication history first"
        breadcrumbs={[{ label: "Pharmacy & Finance" }, { label: "Pharmacy" }]}
      />

      {isPending ? (
        <ListSkeleton />
      ) : queue === null ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Prescriptions are not available for your role.</p>
      ) : !queue?.length ? (
        <EmptyState icon={PillIcon} title="Nothing to dispense" description="Prescriptions written by doctors appear here as soon as they are signed off." />
      ) : (
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-2">
          {(queue ?? []).map((rx) => (
            <div key={rx.id} className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50">
              <span className="w-24 shrink-0 text-xs tabular-nums text-muted-foreground">
                {rx.authoredOn ? format(new Date(rx.authoredOn), "d MMM HH:mm") : "—"}
              </span>
              <PersonAvatar name={rx.subject?.display ?? "Patient"} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{rx.subject?.display ?? rx.subject?.reference}</p>
                <p className="truncate text-xs text-muted-foreground">
                  <PillIcon className="mr-1 inline size-3.5" />
                  {rx.medicationCodeableConcept?.text} — {rx.dosageInstruction?.[0]?.text}
                  {rx.dispenseRequest?.quantity?.value ? ` · qty ${rx.dispenseRequest.quantity.value}` : ""}
                  {rx.requester?.display ? ` · ${rx.requester.display}` : ""}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setHistoryFor(rx)}>
                <HistoryIcon /> History
              </Button>
              <RoleGate roles={["pharmacist"]}>
                <Button size="sm" onClick={() => setDispensing(rx)}>
                  Dispense
                </Button>
              </RoleGate>
            </div>
          ))}
        </div>
      )}

      <Sheet open={historyFor !== null} onOpenChange={(v) => !v && setHistoryFor(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Medication history</SheetTitle>
            <SheetDescription>{historyFor?.subject?.display ?? "Patient"} — every prescription and dispense on record</SheetDescription>
          </SheetHeader>
          {historyFor && <MedicationHistory patientId={historyFor.subject?.reference?.split("/")[1]} />}
        </SheetContent>
      </Sheet>

      {dispensing && <DispenseDialog rx={dispensing} onClose={() => setDispensing(null)} />}
    </div>
  )
}

function MedicationHistory({ patientId }: { patientId: string | undefined }) {
  const { data, isPending } = usePatientMedicationHistory(patientId)
  if (isPending) return <div className="p-4"><ListSkeleton /></div>
  if (!data) return null
  const { requests, dispenses, allergies } = data

  return (
    <div className="flex flex-col gap-5 p-4">
      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Allergies</p>
        {allergies === null ? (
          <p className="text-sm text-muted-foreground">Not available for your role.</p>
        ) : allergies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No allergies recorded.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {allergies.map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <TriangleAlertIcon className="size-4" />
                {a.code?.text ?? a.code?.coding?.[0]?.display ?? "Allergy"}
                {a.reaction?.[0]?.manifestation?.[0]?.text ? ` — ${a.reaction[0].manifestation[0].text}` : ""}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Prescriptions</p>
        {requests === null ? (
          <p className="text-sm text-muted-foreground">Not available for your role.</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">None on record.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {requests.map((r) => (
              <div key={r.id} className="rounded-lg border border-border px-3 py-2">
                <p className="text-sm font-medium">{r.medicationCodeableConcept?.text}</p>
                <p className="text-xs text-muted-foreground">
                  {r.dosageInstruction?.[0]?.text} · {r.status}
                  {r.authoredOn ? ` · ${format(new Date(r.authoredOn), "d MMM yyyy")}` : ""}
                  {r.requester?.display ? ` · ${r.requester.display}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Dispensed</p>
        {dispenses === null ? (
          <p className="text-sm text-muted-foreground">Not available for your role.</p>
        ) : dispenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing dispensed yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {dispenses.map((d) => (
              <div key={d.id} className="rounded-lg border border-border px-3 py-2">
                <p className="text-sm font-medium">{d.medicationCodeableConcept?.text}</p>
                <p className="text-xs text-muted-foreground">
                  {d.quantity?.value ? `qty ${d.quantity.value} · ` : ""}
                  {d.whenHandedOver ? format(new Date(d.whenHandedOver), "d MMM yyyy, HH:mm") : d.status}
                  {d.performer?.[0]?.actor?.display ? ` · ${d.performer[0].actor.display}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/**
 * Allergies, shown unconditionally before dispensing (Manuscript §4.6).
 *
 * §4.6 flags allergies as always-visible and non-negotiable for pharmacy.
 * They were reachable only behind the History button, which means a
 * pharmacist could dispense without ever having seen them. A safety signal
 * you have to go looking for is not a safety signal.
 */
function AllergyBanner({ patientId }: { patientId: string | undefined }) {
  const { data, isPending } = usePatientMedicationHistory(patientId)

  if (isPending) {
    return (
      <div className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
        Checking allergies…
      </div>
    )
  }

  const allergies = data?.allergies
  if (allergies === null || allergies === undefined) {
    return (
      <div className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
        Allergies are not available for your role — confirm with the patient.
      </div>
    )
  }

  if (allergies.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
        <TriangleAlertIcon className="size-4 shrink-0" />
        No allergies recorded. Confirm with the patient before dispensing.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-destructive/10 px-3 py-2">
      <p className="flex items-center gap-2 text-sm font-medium text-destructive">
        <TriangleAlertIcon className="size-4 shrink-0" />
        {allergies.length} recorded {allergies.length === 1 ? "allergy" : "allergies"}
      </p>
      <ul className="flex flex-col gap-0.5 pl-6">
        {allergies.map((a) => (
          <li key={a.id} className="text-sm text-destructive">
            {a.code?.text ?? a.code?.coding?.[0]?.display ?? "Allergy"}
            {a.reaction?.[0]?.manifestation?.[0]?.text
              ? ` — ${a.reaction[0].manifestation[0].text}`
              : ""}
          </li>
        ))}
      </ul>
    </div>
  )
}

function DispenseDialog({ rx, onClose }: { rx: MedicationRequest; onClose: () => void }) {
  const dispense = useDispense()
  const [quantity, setQuantity] = useState(rx.dispenseRequest?.quantity?.value ? String(rx.dispenseRequest.quantity.value) : "")
  const [note, setNote] = useState("")
  const [querying, setQuerying] = useState(false)

  async function submit() {
    try {
      await dispense.mutateAsync({
        medicationRequestId: rx.id as string,
        quantity: quantity.trim() ? Number(quantity) : undefined,
        note: note.trim() || undefined,
      })
      toast.success("Dispensed", { description: `${rx.medicationCodeableConcept?.text} for ${rx.subject?.display ?? "patient"}` })
      onClose()
    } catch (error) {
      toast.error("Could not dispense", { description: error instanceof Error ? error.message : "Try again." })
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dispense</DialogTitle>
          <DialogDescription>
            {rx.medicationCodeableConcept?.text} — {rx.dosageInstruction?.[0]?.text} · {rx.subject?.display ?? "patient"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {/* §4.6: allergies before the quantity field, not behind a button. */}
          <AllergyBanner patientId={rx.subject?.reference?.split("/")[1]} />
          <div className="flex flex-col gap-1">
            <Label htmlFor="disp-qty">Quantity dispensed</Label>
            <Input id="disp-qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="As prescribed" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="disp-note">Note (optional)</Label>
            <Input id="disp-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="e.g. Brand substituted per formulary" />
          </div>
        </div>
        <DialogFooter>
          {/* §4.4's two-way channel applies to pharmacy too: the pharmacist
              can put the prescription back to the prescriber rather than
              only dispensing it or silently refusing. */}
          <Button variant="outline" onClick={() => setQuerying(true)}>
            <MessageCircleQuestionIcon /> Query prescriber
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={dispense.isPending}>
            {dispense.isPending && <Loader2Icon className="animate-spin" />}
            Confirm dispense
          </Button>
        </DialogFooter>
      </DialogContent>

      {querying && (
        <QueryOrderDialog
          open
          onOpenChange={(v) => !v && setQuerying(false)}
          focusRef={`MedicationRequest/${rx.id}`}
          orderLabel={rx.medicationCodeableConcept?.text ?? "Prescription"}
          patientRef={rx.subject?.reference ?? ""}
          patientName={rx.subject?.display ?? "Patient"}
        />
      )}
    </Dialog>
  )
}

export { PharmacyList }
