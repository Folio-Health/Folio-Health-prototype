"use client"

import { format } from "date-fns"
import { SparklesIcon, TriangleAlertIcon, FileTextIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EncounterSnapshot } from "../lib/build-snapshot"
import type { SnapshotSection } from "@/features/patients/lib/patient-tabs-access"

/**
 * The encounter snapshot as a downstream role sees it (Manuscript §4.4, §4.5,
 * §4.6, mechanism per §5).
 *
 * This is the whole point of the snapshot concept: a lab scientist,
 * radiographer or pharmacist is told *why* they are being asked to do
 * something, without being handed the physician's clinical note. Which
 * sections appear is decided by the caller's role via `getSnapshotSections`,
 * so no two roles read the same thing (§3).
 *
 * Allergies are rendered as a destructive Alert rather than a list item on
 * purpose — §4.6 calls them out as always-visible and non-negotiable, and a
 * safety signal that looks like every other row is a safety signal people
 * stop seeing.
 */
function ClinicalSnapshot({
  snapshot,
  sections,
  className,
}: {
  snapshot: EncounterSnapshot
  sections: SnapshotSection[]
  className?: string
}) {
  const has = (section: SnapshotSection) => sections.includes(section)
  const showAllergies = has("allergies")

  return (
    <section
      className={cn("flex flex-col gap-4 rounded-xl border border-border bg-card p-4", className)}
      aria-label="Encounter snapshot"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-heading text-sm font-semibold text-foreground">Encounter snapshot</h3>
          <p className="text-xs text-muted-foreground">
            {snapshot.patientName} &middot; {snapshot.ageGender}
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <FileTextIcon aria-hidden="true" />
          Summary, not the full record
        </Badge>
      </header>

      {/* Allergies first and loudest, whenever the role holds them. */}
      {showAllergies &&
        (snapshot.allergies.length > 0 ? (
          <Alert variant="destructive">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>
              {snapshot.allergies.length} recorded{" "}
              {snapshot.allergies.length === 1 ? "allergy" : "allergies"}
            </AlertTitle>
            <AlertDescription>{snapshot.allergies.join(" · ")}</AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>No recorded allergies</AlertTitle>
            <AlertDescription>
              Nothing on file. Confirm with the patient before dispensing.
            </AlertDescription>
          </Alert>
        ))}

      <dl className="flex flex-col gap-3">
        {has("reason") && (
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium text-muted-foreground">Reason for this order</dt>
            <dd className="text-sm text-foreground">
              {snapshot.reason || "No indication recorded on the order."}
            </dd>
          </div>
        )}

        {has("complaint") && (
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium text-muted-foreground">Presenting complaint</dt>
            <dd className="text-sm text-foreground">
              {snapshot.complaint || "No presenting complaint recorded."}
            </dd>
          </div>
        )}

        {has("medications") && (
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-medium text-muted-foreground">Medication history</dt>
            <dd>
              {snapshot.medications.length > 0 ? (
                <ul className="flex flex-col gap-1">
                  {snapshot.medications.map((med, i) => (
                    <li
                      key={`${med.drugName}-${med.prescribedOn}-${i}`}
                      className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm"
                    >
                      <span className="text-foreground">{med.drugName}</span>
                      <span className="text-xs text-muted-foreground">
                        {med.dosage} &middot; {format(new Date(med.prescribedOn), "d MMM yyyy")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No prescriptions on file for this patient.
                </p>
              )}
            </dd>
          </div>
        )}
      </dl>

      <footer className="flex items-start gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
        <SparklesIcon className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        <p>
          {snapshot.summary}{" "}
          <span className="text-muted-foreground/80">
            {snapshot.summarySource === "ai"
              ? "Generated summary — verify against the order before acting."
              : "Assembled from the order and the patient record. AI summarisation is not wired up yet."}
          </span>
        </p>
      </footer>
    </section>
  )
}

export { ClinicalSnapshot }
