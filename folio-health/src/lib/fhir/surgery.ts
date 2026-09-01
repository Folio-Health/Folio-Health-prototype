import type {
  Consent,
  Practitioner,
  PractitionerRole,
  Procedure,
  Reference,
} from "@medplum/fhirtypes"
import type {
  ChecklistItemKey,
  ConsentForm,
  PreOpChecklist,
  ProcedureNote,
  Surgery,
  SurgeryStatus,
} from "@/lib/mock/surgery"

/**
 * Surgery to FHIR.
 *
 *   Surgery       -> Procedure          (the operation itself)
 *   ProcedureNote -> the same Procedure (outcome, complications, blood loss)
 *   ConsentForm   -> Consent            (real FHIR consent resource)
 *   PreOpChecklist-> Procedure extension
 *
 * A scheduled operation and a performed one are the SAME Procedure at
 * different statuses — `preparation` then `in-progress` then `completed`. FHIR
 * models it that way deliberately, and splitting the booking from the record
 * would let a hospital have an operation that was performed but never
 * scheduled, or scheduled twice.
 *
 * The procedure note is not a separate document either: findings, complications
 * and outcome are fields ON the Procedure. Writing them to a DocumentReference
 * would put the clinical facts somewhere no system queries for them.
 */

export const THEATRE_EXTENSION_URL = "https://folio.health/fhir/StructureDefinition/theatre-number"
export const SCHEDULED_END_EXTENSION_URL =
  "https://folio.health/fhir/StructureDefinition/scheduled-end"
export const BLOOD_LOSS_EXTENSION_URL = "https://folio.health/fhir/StructureDefinition/blood-loss-ml"
export const CHECKLIST_EXTENSION_URL = "https://folio.health/fhir/StructureDefinition/pre-op-checklist"

/** Surgeon vs anaesthetist, so the two roles stay distinguishable. */
const PERFORMER_ROLE = {
  system: "http://snomed.info/sct",
  surgeon: { code: "304292004", display: "Surgeon" },
  anaesthetist: { code: "158970007", display: "Anaesthetist" },
}

type SurgeryPerformer = Reference<Practitioner | PractitionerRole>

// -- Status -----------------------------------------------------------------

export function toSurgeryStatus(procedure: Procedure): SurgeryStatus {
  switch (procedure.status) {
    case "completed":
      return "Completed"
    case "in-progress":
      return "In Progress"
    case "not-done":
    case "stopped":
      return "Cancelled"
    default:
      return "Scheduled"
  }
}

export function fromSurgeryStatus(status: SurgeryStatus): Procedure["status"] {
  switch (status) {
    case "Completed":
      return "completed"
    case "In Progress":
      return "in-progress"
    case "Cancelled":
      return "not-done"
    default:
      // "preparation" is FHIR's word for booked-but-not-started; "planned" is
      // not a Procedure status.
      return "preparation"
  }
}

// -- Reading ----------------------------------------------------------------

function performerId(procedure: Procedure, code: string): string {
  const match = procedure.performer?.find((p) =>
    p.function?.coding?.some((c) => c.code === code)
  )
  return match?.actor?.reference?.split("/")[1] ?? ""
}

function extensionNumber(procedure: Procedure, url: string): number | undefined {
  const found = procedure.extension?.find((e) => e.url === url)
  return found?.valueInteger ?? found?.valueDecimal
}

export function toSurgery(procedure: Procedure): Surgery {
  const start = procedure.performedPeriod?.start ?? procedure.performedDateTime ?? ""
  const end = procedure.performedPeriod?.end

  // Duration is derived from the period when one exists, so the schedule cannot
  // claim a length that contradicts its own start and end times.
  let durationMinutes = 0
  if (start && end) {
    durationMinutes = Math.max(
      0,
      Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
    )
  }

  return {
    id: procedure.id ?? "",
    patientId: procedure.subject?.reference?.split("/")[1] ?? "",
    procedure: procedure.code?.text ?? procedure.code?.coding?.[0]?.display ?? "Procedure",
    surgeonId: performerId(procedure, PERFORMER_ROLE.surgeon.code),
    anesthesiologistId: performerId(procedure, PERFORMER_ROLE.anaesthetist.code),
    theatreNumber: extensionNumber(procedure, THEATRE_EXTENSION_URL) ?? 0,
    date: start ? start.slice(0, 10) : "",
    scheduledTime: start,
    durationMinutes,
    status: toSurgeryStatus(procedure),
  }
}

export function toProcedureNote(procedure: Procedure): ProcedureNote {
  return {
    surgeryId: procedure.id ?? "",
    // `outcome` is the summary; `note` carries the operative detail.
    procedureDetails: procedure.note?.map((n) => n.text).filter(Boolean).join("\n\n") ?? "",
    findings: procedure.outcome?.text ?? "",
    complications: procedure.complication?.map((c) => c.text).filter(Boolean).join("; ") ?? "",
    bloodLossMl: extensionNumber(procedure, BLOOD_LOSS_EXTENSION_URL) ?? 0,
    createdAt: procedure.performedPeriod?.end ?? procedure.meta?.lastUpdated ?? "",
  }
}

export function toPreOpChecklist(procedure: Procedure): PreOpChecklist {
  const raw = procedure.extension?.find((e) => e.url === CHECKLIST_EXTENSION_URL)?.valueString
  let items = {} as Record<ChecklistItemKey, boolean>
  if (raw) {
    try {
      items = JSON.parse(raw) as Record<ChecklistItemKey, boolean>
    } catch {
      // A corrupt checklist reads as nothing ticked, which is the safe
      // direction: it prompts the team to check again rather than asserting
      // that a step was completed.
      items = {} as Record<ChecklistItemKey, boolean>
    }
  }
  return { surgeryId: procedure.id ?? "", items }
}

export function toConsentForm(consent: Consent, procedureName: string): ConsentForm {
  const signature = consent.provision?.actor?.[0]
  return {
    id: consent.id ?? "",
    surgeryId:
      consent.provision?.data?.find((d) => d.reference?.reference?.startsWith("Procedure/"))
        ?.reference?.reference?.split("/")[1] ?? "",
    patientId: consent.patient?.reference?.split("/")[1] ?? "",
    procedure: procedureName,
    risks: consent.provision?.purpose?.map((p) => p.display).filter(Boolean).join("; ") ?? "",
    // "active" is FHIR's word for a consent that has been given and stands.
    signed: consent.status === "active",
    signedBy: signature?.reference?.display,
    date: consent.dateTime ?? consent.meta?.lastUpdated ?? "",
  }
}

// -- Writing ----------------------------------------------------------------

export interface BuildSurgeryInput {
  patientId: string
  procedure: string
  theatreNumber: number
  scheduledStart: string
  durationMinutes: number
  surgeon?: SurgeryPerformer
  anaesthetist?: SurgeryPerformer
}

export function buildSurgery(input: BuildSurgeryInput): Procedure {
  const start = new Date(input.scheduledStart)
  const end = new Date(start.getTime() + input.durationMinutes * 60000)

  return {
    resourceType: "Procedure",
    status: "preparation",
    // Free text, not a guessed SNOMED code. A wrong procedure code is a
    // clinical error, and Folio's list is hospital-local theatre language.
    code: { text: input.procedure },
    subject: { reference: `Patient/${input.patientId}` },
    // The scheduled slot lives in performedPeriod so the booking and the
    // eventual record are the same span, updated rather than duplicated.
    performedPeriod: { start: start.toISOString(), end: end.toISOString() },
    performer: [
      ...(input.surgeon
        ? [
            {
              function: {
                coding: [{ system: PERFORMER_ROLE.system, ...PERFORMER_ROLE.surgeon }],
              },
              actor: input.surgeon,
            },
          ]
        : []),
      ...(input.anaesthetist
        ? [
            {
              function: {
                coding: [{ system: PERFORMER_ROLE.system, ...PERFORMER_ROLE.anaesthetist }],
              },
              actor: input.anaesthetist,
            },
          ]
        : []),
    ],
    extension: [{ url: THEATRE_EXTENSION_URL, valueInteger: input.theatreNumber }],
  }
}

/** Record the operative note and close the procedure. */
export function withProcedureNote(
  procedure: Procedure,
  note: Omit<ProcedureNote, "surgeryId" | "createdAt">
): Procedure {
  const others = (procedure.extension ?? []).filter((e) => e.url !== BLOOD_LOSS_EXTENSION_URL)
  return {
    ...procedure,
    status: "completed",
    // The operation ends when it is written up, unless an end was already set.
    performedPeriod: {
      ...procedure.performedPeriod,
      start: procedure.performedPeriod?.start ?? new Date().toISOString(),
      end: procedure.performedPeriod?.end ?? new Date().toISOString(),
    },
    ...(note.findings ? { outcome: { text: note.findings } } : {}),
    ...(note.complications ? { complication: [{ text: note.complications }] } : {}),
    ...(note.procedureDetails ? { note: [{ text: note.procedureDetails }] } : {}),
    extension: [
      ...others,
      ...(note.bloodLossMl
        ? [{ url: BLOOD_LOSS_EXTENSION_URL, valueInteger: Math.round(note.bloodLossMl) }]
        : []),
    ],
  }
}

export function withChecklist(
  procedure: Procedure,
  items: Record<string, boolean>
): Procedure {
  const others = (procedure.extension ?? []).filter((e) => e.url !== CHECKLIST_EXTENSION_URL)
  return {
    ...procedure,
    extension: [...others, { url: CHECKLIST_EXTENSION_URL, valueString: JSON.stringify(items) }],
  }
}

export function withSurgeryStatus(procedure: Procedure, status: SurgeryStatus): Procedure {
  return { ...procedure, status: fromSurgeryStatus(status) }
}

export interface BuildConsentInput {
  patientId: string
  procedureId: string
  procedureName: string
  risks: string
  signedBy?: string
}

/**
 * A surgical consent.
 *
 * Created as `proposed` — a consent form that exists is not a consent that has
 * been given, and defaulting to `active` would record the patient as having
 * agreed to something nobody asked them about.
 */
export function buildConsent(input: BuildConsentInput): Consent {
  return {
    resourceType: "Consent",
    status: "proposed",
    scope: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: "treatment",
          display: "Treatment",
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/consentcategorycodes",
            code: "npp",
            display: "Notice of Privacy Practices",
          },
        ],
        text: "Surgical consent",
      },
    ],
    patient: { reference: `Patient/${input.patientId}` },
    dateTime: new Date().toISOString(),
    provision: {
      type: "permit",
      data: [{ meaning: "related", reference: { reference: `Procedure/${input.procedureId}` } }],
      ...(input.risks ? { purpose: [{ system: "https://folio.health/fhir/sid/consent-risk", code: "risks", display: input.risks }] } : {}),
    },
  }
}

/** Mark a consent as given, recording who signed. */
export function signConsent(consent: Consent, signedBy: string): Consent {
  return {
    ...consent,
    status: "active",
    dateTime: new Date().toISOString(),
    provision: {
      ...consent.provision,
      type: consent.provision?.type ?? "permit",
      actor: [
        {
          role: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                code: "CST",
                display: "custodian",
              },
            ],
          },
          reference: { display: signedBy },
        },
      ],
    },
  }
}
