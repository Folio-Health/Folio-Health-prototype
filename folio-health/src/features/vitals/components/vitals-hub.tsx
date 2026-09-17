"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ActivityIcon, Loader2Icon, SearchIcon, UserPlusIcon } from "lucide-react"
import { toast } from "sonner"
import type { Encounter } from "@medplum/fhirtypes"
import { PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { EmptyState } from "@/components/common/empty-state"
import { ListSkeleton } from "@/components/common/loading-skeletons"
import { RoleGate } from "@/components/common/role-gate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ENCOUNTER_STATUS_LABELS, encounterStatus, type EncounterStatus } from "@/lib/clinical/encounter"
import { REQUIRED_VITALS, UNIT_LABELS, VITAL_SIGNS, formatVital, validateVitals, type VitalValues } from "@/lib/clinical/vitals"
import { usePatientLookup } from "@/features/patients/hooks/use-patients"
import {
  useEncounterVitals,
  useEncountersForDay,
  useOpenEncounter,
  useRecordVitals,
} from "@/features/clinical/hooks/use-clinical"

const STATUS_TONE: Record<EncounterStatus, string> = {
  arrived: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  triaged: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "in-progress": "bg-primary/10 text-primary",
  finished: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground line-through",
}

/**
 * Triage board — the nurse's queue.
 *
 * Lists today's visits (opened automatically when the front desk checks a
 * patient in, or here for a walk-in) and captures vital signs against the
 * selected one. Filing vitals on a "waiting for triage" visit moves it to
 * "ready for doctor" — the vitals ARE the triage step. Every value is a
 * real LOINC-coded Observation on the patient's record.
 */
function VitalsHub() {
  const today = useMemo(() => new Date(), [])
  const { data: encounters, isPending } = useEncountersForDay(today)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rows = useMemo(
    () => (encounters ?? []).filter((e) => encounterStatus(e) !== "cancelled"),
    [encounters]
  )
  const selected = rows.find((e) => e.id === selectedId) ?? null

  return (
    <div>
      <PageHeader
        title="Triage"
        description="Today's visits — take vital signs to mark a patient ready for the doctor"
        breadcrumbs={[{ label: "Clinical" }, { label: "Triage" }]}
        actions={
          <RoleGate roles={["nurse", "doctor"]}>
            <OpenVisitDialog />
          </RoleGate>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Visits today</CardTitle>
            <CardDescription>{format(today, "EEEE, d MMMM")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {isPending ? (
              <ListSkeleton />
            ) : encounters === null ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Not available for your role.</p>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={ActivityIcon}
                title="No visits yet today"
                description="Visits appear here when the front desk checks a patient in, or when you open one for a walk-in."
              />
            ) : (
              rows.map((encounter) => {
                const status = encounterStatus(encounter)
                const name = encounter.subject?.display ?? "Patient"
                return (
                  <button
                    key={encounter.id}
                    type="button"
                    onClick={() => setSelectedId(encounter.id ?? null)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/60 ${
                      encounter.id === selectedId ? "bg-muted/70 ring-1 ring-border" : ""
                    }`}
                  >
                    <span className="w-14 shrink-0 text-sm tabular-nums text-muted-foreground">
                      {encounter.period?.start ? format(new Date(encounter.period.start), "HH:mm") : "—"}
                    </span>
                    <PersonAvatar name={name} size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-sm font-medium text-foreground">{name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {encounter.reasonCode?.[0]?.text ?? "No reason recorded"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONE[status]}`}>
                      {ENCOUNTER_STATUS_LABELS[status]}
                    </span>
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>

        <div className="xl:col-span-2">
          {selected ? (
            <VitalsPanel encounter={selected} />
          ) : (
            <Card>
              <CardContent>
                <EmptyState
                  icon={ActivityIcon}
                  title="Select a visit"
                  description="Choose a patient on the left to take or review their vital signs."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function VitalsPanel({ encounter }: { encounter: Encounter }) {
  const { data: vitals, isPending } = useEncounterVitals(encounter.id)
  const record = useRecordVitals()
  const [values, setValues] = useState<Record<string, string>>({})
  const status = encounterStatus(encounter)
  const closed = status === "finished" || status === "cancelled"

  async function submit() {
    const numeric: VitalValues = {}
    for (const [k, v] of Object.entries(values)) if (v.trim() !== "") numeric[k] = Number(v)
    const problem = validateVitals(numeric)
    if (problem) {
      toast.error(problem)
      return
    }
    try {
      await record.mutateAsync({ encounterId: encounter.id as string, values: numeric })
      toast.success("Vital signs recorded", { description: `${encounter.subject?.display ?? "Patient"} is ready for the doctor.` })
      setValues({})
    } catch (error) {
      toast.error("Could not record vitals", { description: error instanceof Error ? error.message : "Try again." })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{encounter.subject?.display ?? "Patient"}</CardTitle>
        <CardDescription>
          {ENCOUNTER_STATUS_LABELS[status]}
          {" · "}
          <Link href={`/patients/${encounter.subject?.reference?.split("/")[1] ?? ""}`} className="underline">
            open record
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Recorded this visit</p>
          {isPending ? (
            <ListSkeleton />
          ) : !vitals?.length ? (
            <p className="text-sm text-muted-foreground">No vital signs recorded yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {vitals.map((o) => {
                const { label, value } = formatVital(o)
                return (
                  <div key={o.id} className="rounded-lg border border-border px-3 py-2">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground">{value}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {o.effectiveDateTime ? format(new Date(o.effectiveDateTime), "HH:mm") : ""}
                      {o.performer?.[0]?.display ? ` · ${o.performer[0].display}` : ""}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <RoleGate roles={["nurse", "doctor"]}>
          {!closed && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Take vital signs</p>
              <div className="grid grid-cols-2 gap-3">
                {VITAL_SIGNS.map((def) => (
                  <div key={def.key} className="flex flex-col gap-1">
                    <Label htmlFor={`vital-${def.key}`} className="text-xs">
                      {def.label} ({UNIT_LABELS[def.unit] ?? def.unit})
                      {REQUIRED_VITALS.includes(def.key) && <span className="text-destructive"> *</span>}
                    </Label>
                    <Input
                      id={`vital-${def.key}`}
                      type="number"
                      inputMode="decimal"
                      step={def.step ?? 1}
                      min={def.min}
                      max={def.max}
                      value={values[def.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [def.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <Button className="mt-3 w-full" onClick={() => void submit()} disabled={record.isPending}>
                {record.isPending && <Loader2Icon className="animate-spin" />}
                Record vitals
              </Button>
            </div>
          )}
        </RoleGate>
      </CardContent>
    </Card>
  )
}

function OpenVisitDialog() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [patient, setPatient] = useState<{ id: string; name: string } | null>(null)
  const [reason, setReason] = useState("")
  const { data: results, isFetching } = usePatientLookup(search, open && !patient)
  const openVisit = useOpenEncounter()

  async function submit() {
    if (!patient) {
      toast.error("Choose a patient first.")
      return
    }
    try {
      await openVisit.mutateAsync({ patientId: patient.id, reason })
      toast.success("Visit opened", { description: `${patient.name} is waiting for triage.` })
      setOpen(false)
      setPatient(null)
      setSearch("")
      setReason("")
    } catch (error) {
      toast.error("Could not open the visit", { description: error instanceof Error ? error.message : "Try again." })
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlusIcon />
        Open visit (walk-in)
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Open a visit</DialogTitle>
            <DialogDescription>For a patient presenting without an appointment. They must already be registered.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {patient ? (
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm font-medium">{patient.name}</span>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setPatient(null)}>
                  Change
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Name, phone number, or NIN…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                {search.trim().length >= 2 && (
                  <div className="flex flex-col rounded-lg border border-border">
                    {isFetching && !results?.length ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
                    ) : !results?.length ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">No match. Register the patient at Reception first.</p>
                    ) : (
                      results.slice(0, 6).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
                          onClick={() => setPatient({ id: p.id, name: p.name })}
                        >
                          <PersonAvatar name={p.name} size="sm" />
                          <span className="font-medium">{p.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{[p.phone, p.dob].filter(Boolean).join(" · ")}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
            <div className="flex flex-col gap-1">
              <Label htmlFor="visit-reason">Reason for visit</Label>
              <Input id="visit-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="e.g. Fever and headache" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void submit()} disabled={openVisit.isPending}>
              {openVisit.isPending && <Loader2Icon className="animate-spin" />}
              Open visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { VitalsHub }
