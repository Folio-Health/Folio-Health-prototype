// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import { getStaffByRole } from "./staff"

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

export const IMAGING_REQUESTS: ImagingRequest[] = []
export const RADIOLOGY_REPORTS: RadiologyReport[] = []

export function getImagingRequestById(requestId: string): ImagingRequest | undefined {
  return IMAGING_REQUESTS.find((r) => r.id === requestId)
}

export function getReportForRequest(requestId: string): RadiologyReport | undefined {
  return RADIOLOGY_REPORTS.find((r) => r.requestId === requestId)
}
