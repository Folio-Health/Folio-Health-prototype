export type WorkspaceSection =
  | "patient-info"
  | "vitals"
  | "clerking"
  | "orders"
  | "medications"
  | "prescription"
  | "clinical-notes"
  | "attachments"

export type OrderType = "Lab" | "Radiology"
export type OrderPriority = "Routine" | "Urgent"

export interface OrderItem {
  id: string
  type: OrderType
  name: string
  priority: OrderPriority
  createdAt: string
}

export interface MedicationItem {
  id: string
  drugName: string
  dosage: string
  frequency: string
  duration: string
}

export interface AttachmentItem {
  id: string
  name: string
  size: number
  addedAt: string
}
