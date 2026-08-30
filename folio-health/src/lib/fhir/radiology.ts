import type {
  DiagnosticReport,
  Practitioner,
  PractitionerRole,
  Reference,
  ServiceRequest,
} from "@medplum/fhirtypes"
import type {
  ImagingPriority,
  ImagingRequest,
  ImagingStatus,
  Modality,
  RadiologyReport,
  ReportStatus,
} from "@/lib/mock/radiology"

/**
 * Radiology to FHIR.
 *
 *   ImagingRequest  -> ServiceRequest   (the exam that was ordered)
 *   RadiologyReport -> DiagnosticReport (findings and conclusion)
 *
 * Deliberately parallel to lib/fhir/laboratory.ts: the two departments share a
 * workflow shape (order, perform, report, approve) and diverging their mappings
 * would mean two different answers to "is this exam done yet".
 *
 * ImagingStudy is NOT written here. It describes actual DICOM instances held by
 * a PACS, and inventing one for an exam whose images live nowhere would claim
 * imaging exists that cannot be retrieved. `imageIds` stays empty until a real
 * PACS is wired in.
 */

/** DICOM modality codes — the interchange vocabulary radiology systems expect. */
const DICOM_MODALITY_SYSTEM = "http://dicom.nema.org/resources/ontology/DCM"

const MODALITY_CODES: Record<Modality, { code: string; display: string }> = {
  "X-ray": { code: "CR", display: "Computed Radiography" },
  MRI: { code: "MR", display: "Magnetic Resonance" },
  "CT Scan": { code: "CT", display: "Computed Tomography" },
  Ultrasound: { code: "US", display: "Ultrasound" },
}

const CODE_TO_MODALITY: Record<string, Modality> = {
  CR: "X-ray",
  DX: "X-ray",
  MR: "MRI",
  CT: "CT Scan",
  US: "Ultrasound",
}

/** Radiology category on the request, so lab and imaging orders stay separable. */
export const RADIOLOGY_CATEGORY = {
  system: "http://snomed.info/sct",
  code: "363679005",
  display: "Imaging",
}

/** Body part, which FHIR carries as a free-text-capable CodeableConcept. */
export const BODY_PART_SYSTEM = "https://folio.health/fhir/sid/body-part"

type RadiologyPerformer = Reference<Practitioner | PractitionerRole>

// -- Status mapping ---------------------------------------------------------

export function toImagingStatus(
  request: ServiceRequest,
  report: DiagnosticReport | undefined
): ImagingStatus {
  // A report supersedes the request's own status: once findings exist, the exam
  // is reported regardless of what the order still says.
  if (report) {
    return report.status === "final" || report.status === "amended" ? "Reported" : "Completed"
  }
  if (request.status === "completed") return "Completed"
  if (request.status === "active") return "In Progress"
  return "Pending"
}

export function toReportStatus(report: DiagnosticReport): ReportStatus {
  switch (report.status) {
    case "final":
    case "amended":
    case "corrected":
      return "Approved"
    case "preliminary":
      return "Final"
    default:
      return "Draft"
  }
}

export function toImagingPriority(request: ServiceRequest): ImagingPriority {
  if (request.priority === "stat") return "STAT"
  if (request.priority === "urgent" || request.priority === "asap") return "Urgent"
  return "Routine"
}

function fromImagingPriority(priority: ImagingPriority): ServiceRequest["priority"] {
  if (priority === "STAT") return "stat"
  if (priority === "Urgent") return "urgent"
  return "routine"
}

function modalityOf(resource: ServiceRequest | DiagnosticReport): Modality {
  const coding = resource.category
    ?.flatMap((c) => c.coding ?? [])
    .find((c) => c.system === DICOM_MODALITY_SYSTEM)
  // Falls back to X-ray only when the code is absent or unrecognised; an
  // unknown modality is better shown as the most common one than as a crash.
  return (coding?.code && CODE_TO_MODALITY[coding.code]) || "X-ray"
}

function bodyPartOf(resource: ServiceRequest | DiagnosticReport): string {
  if (resource.resourceType === "ServiceRequest") {
    const site = resource.bodySite?.[0]
    return site?.text ?? site?.coding?.[0]?.display ?? ""
  }
  return ""
}

// -- Reading ----------------------------------------------------------------

export function toImagingRequest(
  request: ServiceRequest,
  report?: DiagnosticReport
): ImagingRequest {
  return {
    id: request.id ?? "",
    patientId: request.subject?.reference?.split("/")[1] ?? "",
    doctorId: request.requester?.reference?.split("/")[1] ?? "",
    radiologistId: report?.performer?.[0]?.reference?.split("/")[1] ?? "",
    modality: modalityOf(request),
    bodyPart: bodyPartOf(request),
    clinicalIndication: request.reasonCode?.[0]?.text ?? request.note?.[0]?.text ?? "",
    orderedAt: request.authoredOn ?? request.meta?.lastUpdated ?? "",
    status: toImagingStatus(request, report),
    priority: toImagingPriority(request),
    // Empty until a PACS is connected — see the note at the top of this file.
    imageIds: [],
  }
}

/** Severity from the report's own conclusion coding, never inferred from text. */
function severityOf(report: DiagnosticReport): RadiologyReport["severity"] {
  const code = report.conclusionCode?.[0]?.coding?.[0]?.code
  if (code === "critical" || code === "AA") return "Critical"
  if (code === "abnormal" || code === "A") return "Abnormal"
  return "Normal"
}

export function toRadiologyReport(report: DiagnosticReport): RadiologyReport {
  const basedOn = report.basedOn?.find((r) => r.reference?.startsWith("ServiceRequest/"))
  return {
    id: report.id ?? "",
    requestId: basedOn?.reference?.split("/")[1] ?? "",
    patientId: report.subject?.reference?.split("/")[1] ?? "",
    radiologistId: report.performer?.[0]?.reference?.split("/")[1] ?? "",
    modality: modalityOf(report),
    bodyPart: "",
    examination: report.code?.text ?? report.code?.coding?.[0]?.display ?? "Imaging study",
    date: report.effectiveDateTime ?? report.issued ?? "",
    // `presentedForm` would be the rendered report; `conclusion` is the
    // radiologist's summary. Findings live in the narrative text.
    findings: report.text?.div?.replace(/<[^>]*>/g, " ").trim() ?? "",
    conclusion: report.conclusion ?? "",
    status: toReportStatus(report),
    severity: severityOf(report),
  }
}

// -- Writing ----------------------------------------------------------------

export interface BuildImagingOrderInput {
  patientId: string
  modality: Modality
  bodyPart: string
  clinicalIndication?: string
  priority: ImagingPriority
  requester?: RadiologyPerformer
}

export function buildImagingOrder(input: BuildImagingOrderInput): ServiceRequest {
  const modality = MODALITY_CODES[input.modality]
  return {
    resourceType: "ServiceRequest",
    status: "active",
    intent: "order",
    priority: fromImagingPriority(input.priority),
    category: [
      { coding: [RADIOLOGY_CATEGORY] },
      { coding: [{ system: DICOM_MODALITY_SYSTEM, ...modality }] },
    ],
    // Named as the clinician ordered it ("CT Scan - Chest"). A RadLex or LOINC
    // imaging code would be better, but this catalogue is free-text body parts
    // crossed with modalities, and there is no lookup to map that pair safely.
    code: { text: `${input.modality} - ${input.bodyPart}` },
    bodySite: [{ text: input.bodyPart }],
    subject: { reference: `Patient/${input.patientId}` },
    authoredOn: new Date().toISOString(),
    ...(input.clinicalIndication ? { reasonCode: [{ text: input.clinicalIndication }] } : {}),
    ...(input.requester ? { requester: input.requester } : {}),
  }
}

export interface BuildRadiologyReportInput {
  patientId: string
  modality: Modality
  bodyPart: string
  basedOn?: Reference<ServiceRequest>
  performer?: RadiologyPerformer
  findings: string
  conclusion: string
  severity: RadiologyReport["severity"]
  /** `preliminary` until a consultant signs it off into `final`. */
  status?: "preliminary" | "final"
}

export function buildRadiologyReport(input: BuildRadiologyReportInput): DiagnosticReport {
  const now = new Date().toISOString()
  const modality = MODALITY_CODES[input.modality]
  const severityCode =
    input.severity === "Critical" ? "critical" : input.severity === "Abnormal" ? "abnormal" : "normal"

  return {
    resourceType: "DiagnosticReport",
    status: input.status ?? "preliminary",
    category: [
      {
        coding: [
          { system: "http://terminology.hl7.org/CodeSystem/v2-0074", code: "RAD", display: "Radiology" },
        ],
      },
      { coding: [{ system: DICOM_MODALITY_SYSTEM, ...modality }] },
    ],
    code: { text: `${input.modality} - ${input.bodyPart}` },
    subject: { reference: `Patient/${input.patientId}` },
    effectiveDateTime: now,
    issued: now,
    conclusion: input.conclusion,
    conclusionCode: [
      {
        coding: [{ system: "https://folio.health/fhir/sid/report-severity", code: severityCode }],
        text: input.severity,
      },
    ],
    // Findings go in the narrative, which is where FHIR puts the human-readable
    // body of a report. Escaped, because this is clinician-entered free text
    // being embedded in XHTML.
    text: {
      status: "additional",
      div: `<div xmlns="http://www.w3.org/1999/xhtml">${escapeXhtml(input.findings)}</div>`,
    },
    ...(input.basedOn ? { basedOn: [input.basedOn] } : {}),
    ...(input.performer ? { performer: [input.performer] } : {}),
  }
}

function escapeXhtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
