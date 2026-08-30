import type {
  DiagnosticReport,
  Observation,
  Practitioner,
  PractitionerRole,
  Reference,
  ServiceRequest,
} from "@medplum/fhirtypes"
import type {
  LabOrder,
  LabOrderStatus,
  LabPriority,
  LabResult,
  LabWorkflowStatus,
  ResultFlag,
  ResultParameter,
} from "@/lib/mock/laboratory"
import { parameterConcept, testConcept } from "./loinc"

/**
 * Laboratory to FHIR.
 *
 *   LabOrder   -> ServiceRequest    (what was asked for)
 *   LabResult  -> DiagnosticReport  (the report as a whole)
 *   parameters -> Observation       (one per measured analyte)
 *
 * The types still come from `lib/mock/laboratory` on purpose: that module now
 * holds only the vocabulary (statuses, flags, the test catalogue) with its
 * fabricated records removed, and the UI is built against those shapes. Moving
 * the type definitions is a separate refactor from putting real data behind
 * them, and doing both at once would make this diff unreviewable.
 */

const LAB_CATEGORY = [
  {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/observation-category",
        code: "laboratory",
        display: "Laboratory",
      },
    ],
  },
]

/** Test category (Hematology, Biochemistry). No FHIR code system covers it. */
export const TEST_CATEGORY_SYSTEM = "https://folio.health/fhir/sid/lab-category"

type LabPerformer = Reference<Practitioner | PractitionerRole>

// -- Status mapping ---------------------------------------------------------
//
// FHIR splits what the UI calls one "workflow status" across two resources:
// ServiceRequest.status tracks the REQUEST, DiagnosticReport.status tracks the
// REPORT. Mapping both ways here keeps that translation in one place.

export function toWorkflowStatus(report: DiagnosticReport | undefined): LabWorkflowStatus {
  switch (report?.status) {
    case "final":
    case "amended":
    case "corrected":
      return "Approved"
    case "preliminary":
      return "Completed"
    case "partial":
      return "In Progress"
    default:
      return "Pending"
  }
}

export function toOrderStatus(request: ServiceRequest): LabOrderStatus {
  if (request.status === "revoked" || request.status === "entered-in-error") return "Cancelled"
  // "active" means the request stands but no specimen is recorded against it.
  return request.specimen?.length ? "Collected" : "Pending Collection"
}

export function toPriority(request: ServiceRequest): LabPriority {
  switch (request.priority) {
    case "stat":
      return "STAT"
    case "urgent":
    case "asap":
      return "Urgent"
    default:
      return "Routine"
  }
}

function fromPriority(priority: LabPriority): ServiceRequest["priority"] {
  if (priority === "STAT") return "stat"
  if (priority === "Urgent") return "urgent"
  return "routine"
}

// -- Interpretation flags ---------------------------------------------------

/**
 * FHIR interpretation codes to the UI's three-level flag.
 *
 * Critical codes are deliberately distinguished from plain high/low: collapsing
 * them would hide the difference between "out of range" and "call the doctor
 * now", which is the entire point of flagging a result.
 */
export function toResultFlag(observation: Observation): ResultFlag {
  const code = observation.interpretation?.[0]?.coding?.[0]?.code
  if (code === "HH" || code === "LL" || code === "AA" || code === "CRIT") return "Critical"
  if (code === "H" || code === "L" || code === "A") return "Abnormal"
  return "Normal"
}

function interpretationFor(flag: ResultFlag) {
  const code = flag === "Critical" ? "AA" : flag === "Abnormal" ? "A" : "N"
  const display =
    flag === "Critical" ? "Critical abnormal" : flag === "Abnormal" ? "Abnormal" : "Normal"
  return [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
          code,
          display,
        },
      ],
    },
  ]
}

// -- Reading ----------------------------------------------------------------

function referenceRangeText(observation: Observation): string {
  const range = observation.referenceRange?.[0]
  if (!range) return ""
  if (range.text) return range.text
  const low = range.low?.value
  const high = range.high?.value
  if (low !== undefined && high !== undefined) return `${low} - ${high}`
  if (low !== undefined) return `> ${low}`
  if (high !== undefined) return `< ${high}`
  return ""
}

function observationValue(observation: Observation): string {
  if (observation.valueQuantity?.value !== undefined) {
    return String(observation.valueQuantity.value)
  }
  if (observation.valueString) return observation.valueString
  if (observation.valueCodeableConcept) {
    return (
      observation.valueCodeableConcept.text ??
      observation.valueCodeableConcept.coding?.[0]?.display ??
      ""
    )
  }
  return ""
}

export function toResultParameter(observation: Observation): ResultParameter {
  return {
    parameter: observation.code?.text ?? observation.code?.coding?.[0]?.display ?? "Unknown",
    unit: observation.valueQuantity?.unit ?? "",
    referenceRange: referenceRangeText(observation),
    result: observationValue(observation),
    flag: toResultFlag(observation),
  }
}

/** The worst flag across the panel: a report is as urgent as its worst value. */
function overallFlag(parameters: ResultParameter[]): ResultFlag | null {
  if (!parameters.length) return null
  if (parameters.some((p) => p.flag === "Critical")) return "Critical"
  if (parameters.some((p) => p.flag === "Abnormal")) return "Abnormal"
  return "Normal"
}

export interface ReportContext {
  /** Observations referenced by the report, keyed by `Observation/<id>`. */
  observations: Map<string, Observation>
  /** Display names for referenced Practitioners, keyed by `Practitioner/<id>`. */
  practitioners?: Map<string, string>
  /** The ServiceRequest that produced the report, when it was fetched too. */
  request?: ServiceRequest
}

export function toLabResult(report: DiagnosticReport, context: ReportContext): LabResult {
  const parameters = (report.result ?? [])
    .map((r) => (r.reference ? context.observations.get(r.reference) : undefined))
    .filter((o): o is Observation => Boolean(o))
    .map(toResultParameter)

  const workflowStatus = toWorkflowStatus(report)
  const performerRef = report.performer?.[0]?.reference
  const requester = context.request?.requester?.reference

  return {
    id: report.id ?? "",
    patientId: report.subject?.reference?.split("/")[1] ?? "",
    doctorId: requester?.split("/")[1] ?? "",
    labScientistId: performerRef?.split("/")[1] ?? "",
    testType:
      report.category?.find((c) =>
        c.coding?.some((coding) => coding.system === TEST_CATEGORY_SYSTEM)
      )?.coding?.find((coding) => coding.system === TEST_CATEGORY_SYSTEM)?.code ?? "Laboratory",
    testName: report.code?.text ?? report.code?.coding?.[0]?.display ?? "Laboratory test",
    parameters,
    resultSummary: report.conclusion ?? "",
    referenceRangeSummary: parameters
      .filter((p) => p.referenceRange)
      .map((p) => `${p.parameter}: ${p.referenceRange}`)
      .join("; "),
    flag: overallFlag(parameters),
    workflowStatus,
    displayStatus: workflowStatus,
    orderedAt: context.request?.authoredOn ?? report.issued ?? report.meta?.lastUpdated ?? "",
    collectedBy: null,
    collectedAt: report.effectiveDateTime ?? null,
    resultAt: report.issued ?? null,
    // FHIR has no separate "approved" timestamp; a final report IS the approval,
    // so `issued` doubles as it rather than inventing a second date.
    approvedAt: workflowStatus === "Approved" ? (report.issued ?? null) : null,
    approvedBy: performerRef ? (context.practitioners?.get(performerRef) ?? null) : null,
    comments: report.conclusion ?? "",
  }
}

export function toLabOrder(request: ServiceRequest): LabOrder {
  return {
    id: request.id ?? "",
    patientId: request.subject?.reference?.split("/")[1] ?? "",
    doctorId: request.requester?.reference?.split("/")[1] ?? "",
    tests: [request.code?.text ?? request.code?.coding?.[0]?.display ?? "Laboratory test"],
    orderedAt: request.authoredOn ?? request.meta?.lastUpdated ?? "",
    status: toOrderStatus(request),
    priority: toPriority(request),
  }
}

// -- Writing ----------------------------------------------------------------

export interface BuildOrderInput {
  patientId: string
  testName: string
  testCategory?: string
  priority: LabPriority
  requester?: LabPerformer
  note?: string
}

export function buildLabOrder(input: BuildOrderInput): ServiceRequest {
  return {
    resourceType: "ServiceRequest",
    status: "active",
    intent: "order",
    priority: fromPriority(input.priority),
    category: [
      {
        coding: [
          { system: "http://snomed.info/sct", code: "108252007", display: "Laboratory procedure" },
          ...(input.testCategory
            ? [
                {
                  system: TEST_CATEGORY_SYSTEM,
                  code: input.testCategory,
                  display: input.testCategory,
                },
              ]
            : []),
        ],
      },
    ],
    // LOINC-coded from the catalogue map. The three assays without a confirmed
    // code fall back to text-only rather than carrying a guess — see lib/fhir/loinc.ts.
    code: testConcept(input.testName),
    subject: { reference: `Patient/${input.patientId}` },
    authoredOn: new Date().toISOString(),
    ...(input.requester ? { requester: input.requester } : {}),
    ...(input.note ? { note: [{ text: input.note }] } : {}),
  }
}

export interface BuildResultInput {
  patientId: string
  testName: string
  testCategory?: string
  /** The order this reports on, so the two stay linked. */
  basedOn?: Reference<ServiceRequest>
  performer?: LabPerformer
  parameters: ResultParameter[]
  conclusion?: string
  /** `preliminary` until a senior scientist approves it into `final`. */
  status?: "partial" | "preliminary" | "final"
}

/**
 * Build the Observations for a result. The DiagnosticReport is created after
 * them, because it must reference their ids.
 */
export function buildResultObservations(input: BuildResultInput): Observation[] {
  const now = new Date().toISOString()
  return input.parameters.map((parameter) => {
    const numeric = Number(parameter.result)
    const hasNumericValue = parameter.result !== "" && !Number.isNaN(numeric)
    const observation: Observation = {
      resourceType: "Observation",
      status: input.status === "final" ? "final" : "preliminary",
      category: LAB_CATEGORY,
      code: parameterConcept(parameter.parameter),
      subject: { reference: `Patient/${input.patientId}` },
      effectiveDateTime: now,
      interpretation: interpretationFor(parameter.flag),
      ...(parameter.referenceRange ? { referenceRange: [{ text: parameter.referenceRange }] } : {}),
      ...(input.performer ? { performer: [input.performer] } : {}),
      ...(input.basedOn ? { basedOn: [input.basedOn] } : {}),
      // A non-numeric result ("Positive", "Not detected") is stored as a string
      // rather than coerced into NaN.
      ...(hasNumericValue
        ? { valueQuantity: { value: numeric, unit: parameter.unit || undefined } }
        : { valueString: parameter.result }),
    }
    return observation
  })
}

export function buildDiagnosticReport(
  input: BuildResultInput,
  observationRefs: Reference<Observation>[]
): DiagnosticReport {
  const now = new Date().toISOString()
  return {
    resourceType: "DiagnosticReport",
    status: input.status ?? "preliminary",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v2-0074",
            code: "LAB",
            display: "Laboratory",
          },
          ...(input.testCategory
            ? [
                {
                  system: TEST_CATEGORY_SYSTEM,
                  code: input.testCategory,
                  display: input.testCategory,
                },
              ]
            : []),
        ],
      },
    ],
    code: testConcept(input.testName),
    subject: { reference: `Patient/${input.patientId}` },
    effectiveDateTime: now,
    issued: now,
    result: observationRefs,
    ...(input.basedOn ? { basedOn: [input.basedOn] } : {}),
    ...(input.performer ? { performer: [input.performer] } : {}),
    ...(input.conclusion ? { conclusion: input.conclusion } : {}),
  }
}
