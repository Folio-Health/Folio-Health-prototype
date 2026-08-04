import { faker } from "@faker-js/faker"
import { addDays, subHours } from "date-fns"
import { seedFaker, pick, pickWeighted, id } from "./seed"
import { PATIENTS } from "./patients"
import { DOCTORS, getStaffByRole } from "./staff"
import { MEDICAL_IMAGES } from "@/lib/images"

seedFaker(7)

export const RADIOLOGISTS = getStaffByRole("Radiologist")

export type Modality = "X-ray" | "MRI" | "CT Scan" | "Ultrasound"
export type ImagingStatus = "Pending" | "In Progress" | "Completed" | "Reported"
export type ReportStatus = "Draft" | "Final" | "Approved"
export type ImagingPriority = "Routine" | "Urgent" | "STAT"

export const BODY_PARTS_BY_MODALITY: Record<Modality, string[]> = {
  "X-ray": ["Chest", "Wrist", "Knee", "Pelvis", "Spine", "Skull"],
  MRI: ["Brain", "Lumbar Spine", "Knee", "Shoulder", "Cervical Spine"],
  "CT Scan": ["Abdomen", "Chest", "Head", "Pelvis", "Sinuses"],
  Ultrasound: ["Abdomen", "Obstetric", "Pelvis", "Thyroid", "Renal"],
}

export const MODALITIES: Modality[] = ["X-ray", "MRI", "CT Scan", "Ultrasound"]

const CLINICAL_INDICATIONS = [
  "Persistent cough and chest pain",
  "Suspected fracture following trauma",
  "Chronic lower back pain",
  "Follow up on previous abnormal finding",
  "Routine antenatal screening",
  "Abdominal pain, rule out obstruction",
  "Shortness of breath",
  "Headache with neurological symptoms",
  "Joint swelling and reduced mobility",
  "Preoperative assessment",
]

const FINDINGS_LIBRARY: Record<string, string[]> = {
  Normal: [
    "No acute abnormality detected. Lung fields are clear bilaterally. Cardiac silhouette is within normal limits.",
    "Study is unremarkable. No fracture, dislocation, or soft tissue abnormality identified.",
    "Normal study. Organ size, echotexture, and vascularity are within normal limits.",
  ],
  Abnormal: [
    "Mild patchy opacity noted in the right lower lobe, likely representing early consolidation. Clinical correlation advised.",
    "Small hairline fracture identified at the distal radius. No significant displacement.",
    "Mild degenerative changes with disc space narrowing at L4 to L5. No nerve root compression seen.",
  ],
  Critical: [
    "Large pleural effusion with associated mediastinal shift. Recommend urgent clinical review.",
    "Comminuted fracture with cortical disruption and soft tissue swelling. Urgent orthopedic referral recommended.",
    "Mass lesion identified measuring 4.2cm with irregular margins. Urgent oncology referral recommended.",
  ],
}

const CONCLUSIONS: Record<string, string[]> = {
  Normal: ["No significant abnormality. Correlate clinically as needed.", "Study within normal limits."],
  Abnormal: [
    "Findings likely represent an early/mild process. Recommend short interval follow up imaging.",
    "Non urgent findings. Recommend clinical correlation and outpatient follow up.",
  ],
  Critical: [
    "Findings are concerning and warrant urgent clinical attention.",
    "Urgent referral recommended given the severity of findings.",
  ],
}

export interface ImagingRequest {
  id: string
  patientId: string
  doctorId: string
  radiologistId: string
  modality: Modality
  bodyPart: string
  clinicalIndication: string
  orderedAt: string
  status: ImagingStatus
  priority: ImagingPriority
  imageIds: string[]
}

export interface RadiologyReport {
  id: string
  requestId: string
  patientId: string
  radiologistId: string
  modality: Modality
  bodyPart: string
  examination: string
  date: string
  findings: string
  conclusion: string
  status: ReportStatus
  severity: "Normal" | "Abnormal" | "Critical"
}

const GALLERY_IMAGE_IDS = [...MEDICAL_IMAGES.radiology, ...MEDICAL_IMAGES.laboratory]

function pickImageIds(count: number) {
  return Array.from({ length: count }, () => pick(GALLERY_IMAGE_IDS))
}

function buildRequests(count: number): ImagingRequest[] {
  const requests: ImagingRequest[] = []
  for (let i = 1; i <= count; i++) {
    const modality = pick(MODALITIES)
    const bodyPart = pick(BODY_PARTS_BY_MODALITY[modality])
    const patient = pick(PATIENTS)
    const doctor = pick(DOCTORS)
    const radiologist = pick(RADIOLOGISTS)
    requests.push({
      id: id("RAD", i),
      patientId: patient.id,
      doctorId: doctor.id,
      radiologistId: radiologist?.id ?? doctor.id,
      modality,
      bodyPart,
      clinicalIndication: pick(CLINICAL_INDICATIONS),
      orderedAt: subHours(new Date(), faker.number.int({ min: 2, max: 24 * 21 })).toISOString(),
      status: pickWeighted<ImagingStatus>([
        { value: "Pending", weight: 20 },
        { value: "In Progress", weight: 15 },
        { value: "Completed", weight: 25 },
        { value: "Reported", weight: 40 },
      ]),
      priority: pickWeighted<ImagingPriority>([
        { value: "Routine", weight: 60 },
        { value: "Urgent", weight: 28 },
        { value: "STAT", weight: 12 },
      ]),
      imageIds: pickImageIds(faker.number.int({ min: 3, max: 6 })),
    })
  }
  return requests.sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime())
}

function buildReports(requests: ImagingRequest[]): RadiologyReport[] {
  return requests
    .filter((r) => r.status === "Reported" || r.status === "Completed")
    .map((r, i) => {
      const severity = pickWeighted<"Normal" | "Abnormal" | "Critical">([
        { value: "Normal", weight: 62 },
        { value: "Abnormal", weight: 28 },
        { value: "Critical", weight: 10 },
      ])
      return {
        id: id("RPT", i + 1),
        requestId: r.id,
        patientId: r.patientId,
        radiologistId: r.radiologistId,
        modality: r.modality,
        bodyPart: r.bodyPart,
        examination: `${r.modality} - ${r.bodyPart}`,
        date: addDays(new Date(r.orderedAt), faker.number.int({ min: 0, max: 2 })).toISOString(),
        findings: pick(FINDINGS_LIBRARY[severity]),
        conclusion: pick(CONCLUSIONS[severity]),
        status:
          r.status === "Reported"
            ? pickWeighted<ReportStatus>([
                { value: "Final", weight: 55 },
                { value: "Approved", weight: 40 },
                { value: "Draft", weight: 5 },
              ])
            : "Draft",
        severity,
      }
    })
}

export const IMAGING_REQUESTS: ImagingRequest[] = buildRequests(22)
export const RADIOLOGY_REPORTS: RadiologyReport[] = buildReports(IMAGING_REQUESTS)

export function getImagingRequestById(requestId: string): ImagingRequest | undefined {
  return IMAGING_REQUESTS.find((r) => r.id === requestId)
}

export function getReportForRequest(requestId: string): RadiologyReport | undefined {
  return RADIOLOGY_REPORTS.find((r) => r.requestId === requestId)
}
