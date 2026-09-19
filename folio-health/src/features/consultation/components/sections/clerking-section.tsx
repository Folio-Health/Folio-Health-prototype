"use client"

import { CheckIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  CLERKING_STEPS,
  HPC_FIELDS,
  MANAGEMENT_FIELDS,
  ROS_SYSTEMS,
  completedSteps,
  rosReviewedCount,
  type ClerkingNote,
  type RosSystem,
} from "../../lib/clerking"

/**
 * The physician's clerking interface (Manuscript §4.3).
 *
 * Renders the ten documentation steps in the manuscript's order, from the
 * declarative structure in lib/clerking.ts. Step 10 (Orders) lives in the
 * Orders section of the workspace, because that is where the branch out to
 * Lab, Radiology and Pharmacy actually happens.
 *
 * The progress strip at the top exists for a specific reason: ten steps with
 * a nine-system review inside one of them is a lot to hold in your head
 * mid-consultation, and §6's onboarding goal applies here as much as to the
 * first-run screen — the clinician should never have to guess what is left.
 */

function Field({
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
  rows = 3,
}: {
  id: string
  label: string
  hint?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <Textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        aria-describedby={hint ? `${id}-hint` : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function Step({
  step,
  title,
  description,
  done,
  children,
}: {
  step: number
  title: string
  description?: string
  done: boolean
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
              done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            {done ? <CheckIcon className="size-3.5" /> : step}
          </span>
          {title}
          <span className="sr-only">{done ? " (started)" : " (not started)"}</span>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  )
}

function ClerkingSection({
  note,
  onChange,
}: {
  note: ClerkingNote
  onChange: (note: ClerkingNote) => void
}) {
  const done = completedSteps(note)
  const reviewed = rosReviewedCount(note)

  const set = <K extends keyof ClerkingNote>(key: K, value: ClerkingNote[K]) =>
    onChange({ ...note, [key]: value })

  const setRos = (system: RosSystem, patch: Partial<ClerkingNote["ros"][RosSystem]>) =>
    onChange({ ...note, ros: { ...note.ros, [system]: { ...note.ros[system], ...patch } } })

  return (
    <div className="flex flex-col gap-4">
      {/* Progress across the whole sequence. */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-foreground">Clerking progress</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {done.size} of {CLERKING_STEPS.length} sections started
            </p>
          </div>
          {/* Progress renders its own Track/Indicator — passing them as
              children draws a second bar. */}
          <Progress
            value={(done.size / CLERKING_STEPS.length) * 100}
            className="gap-0"
            aria-label="Clerking progress"
          />
          <ul className="flex flex-wrap gap-1.5">
            {CLERKING_STEPS.map((step) => (
              <li key={step.key}>
                <Badge variant={done.has(step.key) ? "default" : "outline"} className="font-normal">
                  {step.label}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Step
        step={1}
        title="Presenting complaint"
        description="Why the patient came in, in their own words"
        done={done.has("pc")}
      >
        <Field
          id="clerk-pc"
          label="Presenting complaint"
          placeholder='e.g. "Headache and fever for three days"'
          value={note.presentingComplaint}
          onChange={(v) => set("presentingComplaint", v)}
          rows={2}
        />
      </Step>

      <Step
        step={2}
        title="History of presenting complaint"
        description="Onset, duration, character, severity and associated symptoms"
        done={done.has("hpc")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {HPC_FIELDS.map((field) => (
            <Field
              key={field.key}
              id={`clerk-hpc-${field.key}`}
              label={field.label}
              placeholder={field.placeholder}
              value={note.hpc[field.key]}
              onChange={(v) => set("hpc", { ...note.hpc, [field.key]: v })}
              rows={2}
            />
          ))}
        </div>
      </Step>

      <Step
        step={3}
        title="Review of systems"
        description={`${reviewed} of ${ROS_SYSTEMS.length} systems reviewed`}
        done={done.has("ros")}
      >
        <div className="flex flex-col gap-3">
          {ROS_SYSTEMS.map((system) => {
            const entry = note.ros[system.key]
            const checkboxId = `clerk-ros-${system.key}-nad`
            return (
              <div
                key={system.key}
                className="flex flex-col gap-2 rounded-lg border border-border p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-foreground">{system.label}</p>
                    <p className="text-xs text-muted-foreground">{system.hint}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={checkboxId}
                      checked={entry.noAbnormality}
                      onCheckedChange={(checked) => setRos(system.key, { noAbnormality: !!checked })}
                    />
                    <Label htmlFor={checkboxId} className="cursor-pointer text-xs font-normal">
                      No abnormality
                    </Label>
                  </div>
                </div>
                <Textarea
                  id={`clerk-ros-${system.key}`}
                  rows={2}
                  aria-label={`${system.label} findings`}
                  placeholder={
                    entry.noAbnormality ? "Nothing abnormal recorded" : "Findings for this system…"
                  }
                  value={entry.notes}
                  onChange={(e) => setRos(system.key, { notes: e.target.value })}
                />
              </div>
            )
          })}
        </div>
      </Step>

      <Step
        step={4}
        title="Past medical history"
        description="Previous diagnoses, admissions, surgery — a field the Phase 2 interoperability layer is meant to pull rather than re-ask"
        done={done.has("pmhx")}
      >
        <Field
          id="clerk-pmhx"
          label="Past medical history"
          placeholder="Previous illnesses, admissions, operations, transfusions…"
          value={note.pastMedicalHistory}
          onChange={(v) => set("pastMedicalHistory", v)}
        />
      </Step>

      <Step
        step={5}
        title="Social and psychological history"
        done={done.has("social")}
      >
        <Field
          id="clerk-social"
          label="Social history"
          placeholder="Living situation, occupation, alcohol, tobacco, support at home…"
          value={note.socialHistory}
          onChange={(v) => set("socialHistory", v)}
        />
        <Field
          id="clerk-psych"
          label="Psychological history"
          placeholder="Mood, sleep, stressors, previous psychiatric contact…"
          value={note.psychologicalHistory}
          onChange={(v) => set("psychologicalHistory", v)}
        />
      </Step>

      <Step
        step={6}
        title="Drug and medication history"
        description="Current medication, adherence and allergies — also pullable once cross-facility sharing exists"
        done={done.has("drugs")}
      >
        <Field
          id="clerk-drugs"
          label="Drug history"
          placeholder="Current medication, doses, adherence, over-the-counter and herbal use, allergies…"
          value={note.drugHistory}
          onChange={(v) => set("drugHistory", v)}
        />
      </Step>

      <Step step={7} title="Physical examination" done={done.has("exam")}>
        <Field
          id="clerk-exam"
          label="Examination findings"
          placeholder="General appearance, system-by-system examination findings…"
          value={note.physicalExam}
          onChange={(v) => set("physicalExam", v)}
          rows={4}
        />
      </Step>

      <Step
        step={8}
        title="Problem list, diagnosis and differentials"
        done={done.has("problems")}
      >
        <Field
          id="clerk-problems"
          label="Problem list and working diagnosis"
          placeholder="One problem per line…"
          value={note.problemList}
          onChange={(v) => set("problemList", v)}
        />
        <Field
          id="clerk-differentials"
          label="Differential diagnoses"
          placeholder="What else could explain this, and what would rule it in or out?"
          value={note.differentials}
          onChange={(v) => set("differentials", v)}
        />
      </Step>

      <Step
        step={9}
        title="Management plan"
        description="Immediate versus subsequent, medical, supportive and preventive"
        done={done.has("plan")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MANAGEMENT_FIELDS.map((field) => (
            <Field
              key={field.key}
              id={`clerk-plan-${field.key}`}
              label={field.label}
              placeholder={field.placeholder}
              value={note.managementPlan[field.key]}
              onChange={(v) =>
                set("managementPlan", { ...note.managementPlan, [field.key]: v })
              }
              rows={2}
            />
          ))}
        </div>
      </Step>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground tabular-nums"
            >
              10
            </span>
            Orders
          </CardTitle>
          <CardDescription>
            Lab, imaging and pharmacy orders branch out of the management plan. Place them in the
            Orders section of this workspace.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

export { ClerkingSection }
