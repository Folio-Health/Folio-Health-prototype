"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  CheckCircle2Icon,
  FlaskConicalIcon,
  Loader2Icon,
  LockIcon,
  PillIcon,
  PlusIcon,
  ScanIcon,
  ShieldCheckIcon,
} from "lucide-react"
import { toast } from "sonner"
import type { Composition, DiagnosticReport, Encounter, MedicationRequest, ServiceRequest } from "@medplum/fhirtypes"
import { PageHeader } from "@/components/common/page-header"
import { ErrorState } from "@/components/common/empty-state"
import { ListSkeleton } from "@/components/common/loading-skeletons"
import { RoleGate } from "@/components/common/role-gate"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  CLERKING_SECTIONS,
  fromComposition,
  noteReadyToSign,
  toCompositionSections,
  type ClerkingNote,
} from "@/lib/clinical/clerking"
import { ENCOUNTER_STATUS_LABELS, encounterStatus } from "@/lib/clinical/encounter"
import { formatVital } from "@/lib/clinical/vitals"
import { TEST_NAMES } from "@/lib/mock/laboratory"
import { BODY_PARTS_BY_MODALITY, MODALITIES, type Modality } from "@/lib/mock/radiology"
import { usePatient } from "@/features/patients/hooks/use-patients"
import {
  IMAGING_CATEGORY,
  LAB_CATEGORY,
  useCreateClinical,
  useEncounter,
  useEncounterAction,
  useEncounterNote,
  useEncounterOrders,
  useEncounterPrescriptions,
  useEncounterReports,
  useEncounterVitals,
  usePatchClinical,
} from "@/features/clinical/hooks/use-clinical"

/**
 * The clerking workspace — one visit, clerked in the standard sequence:
 * consent → (biodata in the banner) → presenting complaints → HPC → ROS →
 * PMH → drug history & allergies → family → social → special histories →
 * summary → provisional diagnosis → differentials → examination →
 * investigations → management plan.
 *
 * The note is a draft until SIGNED; signing locks it (the server refuses
 * edits to a signed note), records the provisional diagnosis as the
 * encounter diagnosis, and is required before the visit can be closed.
 * Orders and prescriptions are separate records the doctor places from the
 * side panels; results come back into the Results panel as the lab files
 * them.
 */
function ConsultationWorkspace({ encounterId }: { encounterId: string }) {
  const router = useRouter()
  const { data: encounter, isPending, isError } = useEncounter(encounterId)
  const patientId = encounter?.subject?.reference?.split("/")[1]
  const { data: patient } = usePatient(patientId)
  const act = useEncounterAction()

  if (isPending) return <ListSkeleton />
  if (isError || encounter === null || !encounter) {
    return (
      <ErrorState
        title="Visit not found"
        description="This visit doesn't exist, or it is not at your facility."
        action={<Button variant="outline" render={<Link href="/consultation" />}>Back to Consultation</Button>}
      />
    )
  }

  const status = encounterStatus(encounter)
  const closed = status === "finished" || status === "cancelled"

  async function transition(action: "start-consult" | "finish" | "cancel", reason?: string) {
    try {
      await act.mutateAsync({ id: encounterId, action, reason })
      toast.success(
        action === "start-consult" ? "Consultation started" : action === "finish" ? "Visit closed" : "Visit cancelled"
      )
      if (action !== "start-consult") router.push("/consultation")
    } catch (error) {
      toast.error("Could not update the visit", { description: error instanceof Error ? error.message : "Try again." })
    }
  }

  return (
    <div>
      <PageHeader
        title={patient?.name ?? encounter.subject?.display ?? "Patient"}
        description={
          patient
            ? [
                patient.age !== undefined ? `${patient.age} yrs` : undefined,
                patient.gender,
                patient.phone,
                `MRN ${patient.mrn}`,
              ]
                .filter(Boolean)
                .join(" · ")
            : ENCOUNTER_STATUS_LABELS[status]
        }
        breadcrumbs={[{ label: "Clinical" }, { label: "Consultation", href: "/consultation" }, { label: "Visit" }]}
        actions={
          <RoleGate roles={["doctor"]}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{ENCOUNTER_STATUS_LABELS[status]}</span>
              {(status === "arrived" || status === "triaged") && (
                <Button onClick={() => void transition("start-consult")} disabled={act.isPending}>
                  Start consultation
                </Button>
              )}
              {status === "in-progress" && (
                <Button variant="outline" onClick={() => void transition("finish")} disabled={act.isPending}>
                  <CheckCircle2Icon />
                  Close visit
                </Button>
              )}
              {(status === "arrived" || status === "triaged") && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    const reason = window.prompt("Reason for cancelling this visit (e.g. left without being seen):")
                    if (reason?.trim()) void transition("cancel", reason.trim())
                  }}
                  disabled={act.isPending}
                >
                  Cancel visit
                </Button>
              )}
            </div>
          </RoleGate>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <ClerkingNoteCard encounter={encounter} closed={closed} />
        </div>
        <div className="flex flex-col gap-4">
          <VitalsCard encounterId={encounterId} />
          <OrdersCard encounter={encounter} closed={closed} />
          <ResultsCard encounterId={encounterId} />
          <PrescriptionsCard encounter={encounter} closed={closed} />
        </div>
      </div>
    </div>
  )
}

// ── Clerking note ────────────────────────────────────────────────────────────

function ClerkingNoteCard({ encounter, closed }: { encounter: Encounter; closed: boolean }) {
  const { data: composition, isPending } = useEncounterNote(encounter.id as string)
  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clerking note</CardTitle>
        </CardHeader>
        <CardContent>
          <ListSkeleton />
        </CardContent>
      </Card>
    )
  }
  // Keyed on the note version: a freshly saved or signed note re-initialises
  // the editor from the record, with no effect-driven state syncing.
  const key = composition ? `${composition.id}:${composition.meta?.versionId ?? ""}` : "new"
  return <ClerkingNoteEditor key={key} encounter={encounter} closed={closed} composition={composition ?? undefined} />
}

function ClerkingNoteEditor({
  encounter,
  closed,
  composition,
}: {
  encounter: Encounter
  closed: boolean
  composition?: Composition
}) {
  const encounterId = encounter.id as string
  const create = useCreateClinical()
  const patch = usePatchClinical()
  const initial = useMemo(() => fromComposition(composition), [composition])
  const [note, setNote] = useState<ClerkingNote>(() => initial)
  const [consented, setConsented] = useState(false)
  const [showObstetric, setShowObstetric] = useState(() => Boolean(initial.sections.obstetricHistory))
  const [showPaediatric, setShowPaediatric] = useState(() => Boolean(initial.sections.paediatricHistory))

  const signed = composition?.status === "final" || composition?.status === "amended"
  const readOnly = signed || closed
  const readiness = noteReadyToSign(note)
  const saving = create.isPending || patch.isPending

  async function saveDraft(): Promise<Composition | null> {
    const section = toCompositionSections(note)
    try {
      if (composition?.id) {
        const updated = (await patch.mutateAsync({ type: "Composition", id: composition.id, action: "update", section })) as Composition
        return updated
      }
      const created = (await create.mutateAsync({
        resourceType: "Composition",
        status: "preliminary",
        type: { text: "Clerking note" },
        subject: { reference: encounter.subject?.reference as string },
        encounter: { reference: `Encounter/${encounterId}` },
        date: new Date().toISOString(),
        author: [],
        title: "Clerking note",
        section,
      } as Composition)) as Composition
      return created
    } catch (error) {
      toast.error("Could not save the note", { description: error instanceof Error ? error.message : "Try again." })
      return null
    }
  }

  async function sign() {
    if (!consented) {
      toast.error("Confirm the patient's consent before signing.")
      return
    }
    if (readiness) {
      toast.error(readiness)
      return
    }
    const saved = await saveDraft()
    if (!saved?.id) return
    try {
      await patch.mutateAsync({ type: "Composition", id: saved.id, action: "sign" })
      // The provisional diagnosis becomes the encounter diagnosis on the record.
      const dx = note.sections.provisionalDiagnosis?.trim()
      if (dx) {
        await create.mutateAsync({
          resourceType: "Condition",
          clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
          verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "provisional" }] },
          category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-category", code: "encounter-diagnosis" }] }],
          code: { text: dx.slice(0, 300) },
          subject: { reference: encounter.subject?.reference as string },
          encounter: { reference: `Encounter/${encounterId}` },
        })
      }
      toast.success("Note signed", { description: "The clerking note is now part of the legal record and cannot be edited." })
    } catch (error) {
      toast.error("Could not sign the note", { description: error instanceof Error ? error.message : "Try again." })
    }
  }

  const visibleSections = useMemo(
    () =>
      CLERKING_SECTIONS.filter((s) => {
        if (s.key === "obstetricHistory") return showObstetric
        if (s.key === "paediatricHistory") return showPaediatric
        return true
      }),
    [showObstetric, showPaediatric]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Clerking note
          {signed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <LockIcon className="size-3" /> Signed
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {signed && composition?.attester?.[0]
            ? `Signed by ${composition.attester[0].party?.display ?? "the doctor"}${
                composition.attester[0].time ? ` · ${format(new Date(composition.attester[0].time), "d MMM yyyy, HH:mm")}` : ""
              }`
            : "Consent → complaints → history → summary → diagnosis → examination → investigations → plan"}
        </CardDescription>
        {!readOnly && (
          <CardAction>
            <RoleGate roles={["doctor"]}>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => void saveDraft().then((s) => s && toast.success("Draft saved"))} disabled={saving}>
                  Save draft
                </Button>
                <Button size="sm" onClick={() => void sign()} disabled={saving}>
                  {saving && <Loader2Icon className="animate-spin" />}
                  <ShieldCheckIcon />
                  Sign note
                </Button>
              </div>
            </RoleGate>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {(
          <>
            {!readOnly && (
              <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <Checkbox checked={consented} onCheckedChange={(v) => setConsented(v === true)} />
                Patient identified, purpose explained, consent obtained, privacy ensured.
              </label>
            )}

            {visibleSections.map((def) => (
              <div key={def.key} className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium">{def.title}</Label>
                {!readOnly && <p className="text-xs text-muted-foreground">{def.hint}</p>}
                {def.structured === "complaints" ? (
                  <div className="flex flex-col gap-2">
                    {note.complaints.map((c, i) => (
                      <div key={i} className="grid grid-cols-5 gap-2">
                        <Input
                          className="col-span-3"
                          placeholder="Symptom (e.g. Cough)"
                          value={c.symptom}
                          readOnly={readOnly}
                          onChange={(e) =>
                            setNote((n) => ({
                              ...n,
                              complaints: n.complaints.map((x, j) => (j === i ? { ...x, symptom: e.target.value } : x)),
                            }))
                          }
                        />
                        <Input
                          className="col-span-2"
                          placeholder="Duration (e.g. 3 weeks)"
                          value={c.duration}
                          readOnly={readOnly}
                          onChange={(e) =>
                            setNote((n) => ({
                              ...n,
                              complaints: n.complaints.map((x, j) => (j === i ? { ...x, duration: e.target.value } : x)),
                            }))
                          }
                        />
                      </div>
                    ))}
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-fit text-xs"
                        onClick={() => setNote((n) => ({ ...n, complaints: [...n.complaints, { symptom: "", duration: "" }] }))}
                      >
                        <PlusIcon className="size-3.5" /> Add complaint
                      </Button>
                    )}
                  </div>
                ) : (
                  <Textarea
                    data-section={def.key}
                    rows={def.key === "hpc" || def.key === "managementPlan" ? 5 : 3}
                    value={note.sections[def.key] ?? ""}
                    readOnly={readOnly}
                    onChange={(e) => setNote((n) => ({ ...n, sections: { ...n.sections, [def.key]: e.target.value } }))}
                  />
                )}
              </div>
            ))}

            {!readOnly && (
              <div className="flex flex-wrap gap-2">
                {!showObstetric && (
                  <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setShowObstetric(true)}>
                    <PlusIcon className="size-3.5" /> Obstetric & gynaecological history
                  </Button>
                )}
                {!showPaediatric && (
                  <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setShowPaediatric(true)}>
                    <PlusIcon className="size-3.5" /> Paediatric history
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ── Side panels ──────────────────────────────────────────────────────────────

function VitalsCard({ encounterId }: { encounterId: string }) {
  const { data: vitals, isPending } = useEncounterVitals(encounterId)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vital signs</CardTitle>
        <CardDescription>Taken at triage</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <ListSkeleton />
        ) : !vitals?.length ? (
          <p className="text-sm text-muted-foreground">Not taken yet — the nurse records these on the Triage board.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {vitals.map((o) => {
              const { label, value } = formatVital(o)
              return (
                <div key={o.id} className="rounded-lg border border-border px-3 py-2">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function OrdersCard({ encounter, closed }: { encounter: Encounter; closed: boolean }) {
  const encounterId = encounter.id as string
  const { data: orders, isPending } = useEncounterOrders(encounterId)
  const create = useCreateClinical()
  const patch = usePatchClinical()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<"lab" | "imaging">("lab")
  const [test, setTest] = useState("")
  const [modality, setModality] = useState<Modality>(MODALITIES[0])
  const [bodyPart, setBodyPart] = useState("")
  const [priority, setPriority] = useState<"routine" | "urgent" | "stat">("routine")
  const [indication, setIndication] = useState("")

  async function placeOrder() {
    const what = kind === "lab" ? test.trim() : [modality, bodyPart.trim()].filter(Boolean).join(" — ")
    if (!what) {
      toast.error(kind === "lab" ? "Choose a test." : "Choose a modality.")
      return
    }
    if (!indication.trim()) {
      toast.error("State the indication (reason for the investigation).")
      return
    }
    try {
      await create.mutateAsync({
        resourceType: "ServiceRequest",
        status: "active",
        intent: "order",
        priority,
        category: [
          {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: kind === "lab" ? LAB_CATEGORY : IMAGING_CATEGORY,
                display: kind === "lab" ? "Laboratory procedure" : "Imaging",
              },
            ],
          },
        ],
        code: { text: what },
        subject: { reference: encounter.subject?.reference as string },
        encounter: { reference: `Encounter/${encounterId}` },
        reasonCode: [{ text: indication.trim().slice(0, 300) }],
      } as ServiceRequest)
      toast.success("Order placed", { description: what })
      setOpen(false)
      setTest("")
      setBodyPart("")
      setIndication("")
    } catch (error) {
      toast.error("Could not place the order", { description: error instanceof Error ? error.message : "Try again." })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Investigations</CardTitle>
        <CardDescription>Lab and imaging orders for this visit</CardDescription>
        {!closed && (
          <CardAction>
            <RoleGate roles={["doctor"]}>
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <PlusIcon /> Order
              </Button>
            </RoleGate>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {isPending ? (
          <ListSkeleton />
        ) : !orders?.length ? (
          <p className="text-sm text-muted-foreground">No investigations ordered.</p>
        ) : (
          orders.map((o) => {
            const imaging = o.category?.[0]?.coding?.[0]?.code === IMAGING_CATEGORY
            return (
              <div key={o.id} className="flex items-start gap-2 rounded-lg border border-border px-3 py-2">
                {imaging ? <ScanIcon className="mt-0.5 size-4 text-muted-foreground" /> : <FlaskConicalIcon className="mt-0.5 size-4 text-muted-foreground" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{o.code?.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.status}
                    {o.priority && o.priority !== "routine" ? ` · ${o.priority.toUpperCase()}` : ""}
                    {o.reasonCode?.[0]?.text ? ` · ${o.reasonCode[0].text}` : ""}
                  </p>
                </div>
                {o.status === "active" && !closed && (
                  <RoleGate roles={["doctor"]}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        const reason = window.prompt("Reason for revoking this order:")
                        if (reason?.trim()) {
                          void patch
                            .mutateAsync({ type: "ServiceRequest", id: o.id as string, action: "revoke", reason: reason.trim() })
                            .then(() => toast.success("Order revoked"))
                            .catch((e: unknown) => toast.error("Could not revoke", { description: e instanceof Error ? e.message : "" }))
                        }
                      }}
                    >
                      Revoke
                    </Button>
                  </RoleGate>
                )}
              </div>
            )
          })
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order an investigation</DialogTitle>
            <DialogDescription>The performing unit sees the order immediately and results it back to this visit.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Button type="button" variant={kind === "lab" ? "default" : "outline"} size="sm" onClick={() => setKind("lab")}>
                <FlaskConicalIcon /> Laboratory
              </Button>
              <Button type="button" variant={kind === "imaging" ? "default" : "outline"} size="sm" onClick={() => setKind("imaging")}>
                <ScanIcon /> Imaging
              </Button>
            </div>
            {kind === "lab" ? (
              <div className="flex flex-col gap-1">
                <Label>Test</Label>
                <Select value={test} onValueChange={(v) => setTest(v ?? "")}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Choose a test" /></SelectTrigger>
                  <SelectContent>
                    {TEST_NAMES.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label>Modality</Label>
                  <Select value={modality} onValueChange={(v) => { setModality((v as Modality) ?? MODALITIES[0]); setBodyPart("") }}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MODALITIES.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Region</Label>
                  <Select value={bodyPart} onValueChange={(v) => setBodyPart(v ?? "")}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Body part" /></SelectTrigger>
                    <SelectContent>
                      {(BODY_PARTS_BY_MODALITY[modality] ?? []).map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority((v as typeof priority) ?? "routine")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="stat">Stat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="order-indication">Indication</Label>
              <Input id="order-indication" value={indication} onChange={(e) => setIndication(e.target.value)} placeholder="Why is this investigation needed?" maxLength={300} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void placeOrder()} disabled={create.isPending}>
              {create.isPending && <Loader2Icon className="animate-spin" />}
              Place order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function ResultsCard({ encounterId }: { encounterId: string }) {
  const { data: reports, isPending } = useEncounterReports(encounterId)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Results</CardTitle>
        <CardDescription>As the lab / imaging unit files them</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {isPending ? (
          <ListSkeleton />
        ) : !reports?.length ? (
          <p className="text-sm text-muted-foreground">No results yet.</p>
        ) : (
          reports.map((r) => <ReportRow key={r.id} report={r} />)
        )}
      </CardContent>
    </Card>
  )
}

function ReportRow({ report }: { report: DiagnosticReport }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium">{report.code?.text ?? "Report"}</p>
        <span className="text-xs text-muted-foreground">
          {report.status}
          {report.issued ? ` · ${format(new Date(report.issued), "d MMM, HH:mm")}` : ""}
        </span>
      </div>
      {report.conclusion && <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{report.conclusion}</p>}
      {report.result?.length ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {report.result.length} value{report.result.length === 1 ? "" : "s"} · {report.performer?.[0]?.display ?? "performing unit"}
        </p>
      ) : null}
    </div>
  )
}

function PrescriptionsCard({ encounter, closed }: { encounter: Encounter; closed: boolean }) {
  const encounterId = encounter.id as string
  const { data: prescriptions, isPending } = useEncounterPrescriptions(encounterId)
  const create = useCreateClinical()
  const patch = usePatchClinical()
  const [open, setOpen] = useState(false)
  const [drug, setDrug] = useState("")
  const [dose, setDose] = useState("")
  const [frequency, setFrequency] = useState("")
  const [duration, setDuration] = useState("")
  const [quantity, setQuantity] = useState("")
  const [instructions, setInstructions] = useState("")

  async function prescribe() {
    if (!drug.trim() || !dose.trim() || !frequency.trim()) {
      toast.error("Drug, dose and frequency are required.")
      return
    }
    try {
      await create.mutateAsync({
        resourceType: "MedicationRequest",
        status: "active",
        intent: "order",
        medicationCodeableConcept: { text: drug.trim() },
        subject: { reference: encounter.subject?.reference as string },
        encounter: { reference: `Encounter/${encounterId}` },
        dosageInstruction: [
          {
            text: [dose.trim(), frequency.trim(), duration.trim() ? `for ${duration.trim()}` : ""].filter(Boolean).join(" "),
            ...(instructions.trim() ? { patientInstruction: instructions.trim() } : {}),
          },
        ],
        ...(quantity.trim() && Number(quantity) > 0 ? { dispenseRequest: { quantity: { value: Number(quantity) } } } : {}),
      } as MedicationRequest)
      toast.success("Prescription written", { description: `${drug.trim()} — ${dose.trim()} ${frequency.trim()}` })
      setOpen(false)
      setDrug(""); setDose(""); setFrequency(""); setDuration(""); setQuantity(""); setInstructions("")
    } catch (error) {
      toast.error("Could not write the prescription", { description: error instanceof Error ? error.message : "Try again." })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Prescriptions</CardTitle>
        <CardDescription>Sent to the pharmacy queue when written</CardDescription>
        {!closed && (
          <CardAction>
            <RoleGate roles={["doctor"]}>
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <PillIcon /> Prescribe
              </Button>
            </RoleGate>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {isPending ? (
          <ListSkeleton />
        ) : !prescriptions?.length ? (
          <p className="text-sm text-muted-foreground">Nothing prescribed.</p>
        ) : (
          prescriptions.map((rx) => (
            <div key={rx.id} className="flex items-start gap-2 rounded-lg border border-border px-3 py-2">
              <PillIcon className="mt-0.5 size-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{rx.medicationCodeableConcept?.text}</p>
                <p className="text-xs text-muted-foreground">
                  {rx.dosageInstruction?.[0]?.text} · {rx.status}
                </p>
              </div>
              {rx.status === "active" && !closed && (
                <RoleGate roles={["doctor"]}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const reason = window.prompt("Reason for cancelling this prescription:")
                      if (reason?.trim()) {
                        void patch
                          .mutateAsync({ type: "MedicationRequest", id: rx.id as string, action: "cancel", reason: reason.trim() })
                          .then(() => toast.success("Prescription cancelled"))
                          .catch((e: unknown) => toast.error("Could not cancel", { description: e instanceof Error ? e.message : "" }))
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </RoleGate>
              )}
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Write a prescription</DialogTitle>
            <DialogDescription>The pharmacist sees the patient&apos;s medication history and allergies before dispensing.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="rx-drug">Medication</Label>
              <Input id="rx-drug" value={drug} onChange={(e) => setDrug(e.target.value)} placeholder="e.g. Amoxicillin 500 mg capsule" maxLength={200} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="rx-dose">Dose</Label>
                <Input id="rx-dose" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="1 capsule" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="rx-freq">Frequency</Label>
                <Input id="rx-freq" value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="8 hourly" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="rx-dur">Duration</Label>
                <Input id="rx-dur" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="5 days" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="rx-qty">Quantity to dispense</Label>
                <Input id="rx-qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="15" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="rx-instr">Patient instructions</Label>
                <Input id="rx-instr" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="After meals" maxLength={200} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void prescribe()} disabled={create.isPending}>
              {create.isPending && <Loader2Icon className="animate-spin" />}
              Prescribe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export { ConsultationWorkspace }
