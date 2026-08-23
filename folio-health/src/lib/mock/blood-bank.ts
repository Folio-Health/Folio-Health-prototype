// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import { DEPARTMENTS, type BloodGroup, type Department } from "@/types/core"

export const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export type BloodComponent = "Whole Blood" | "Plasma" | "Platelets" | "RBC"
export type UnitStatus = "Available" | "Reserved" | "Expiring Soon" | "Expired" | "Used"
export type ExpiryStatus = "Fresh" | "Expiring" | "Expired"
export type RequestUrgency = "Routine" | "Urgent" | "Emergency"
export type RequestStatus = "Pending" | "Approved" | "Fulfilled" | "Rejected"

export const REQUESTING_DEPTS: Department[] = DEPARTMENTS.filter((d) =>
  [
    "General Medicine",
    "Surgery",
    "Obstetrics & Gynecology",
    "Emergency Medicine",
    "Oncology",
    "Pediatrics",
    "Orthopedics",
    "Intensive Care Unit",
  ].includes(d)
)

export interface BloodUnit {
  id: string
  bloodType: BloodGroup
  component: BloodComponent
  collectedDate: string
  expiryDate: string
  status: UnitStatus
  expiryStatus: ExpiryStatus
  daysToExpiry: number
  donorId: string
  volumeMl: number
}

export interface Donor {
  id: string
  name: string
  bloodType: BloodGroup
  gender: "Male" | "Female"
  phone: string
  email: string
  lastDonationDate: string | null
  totalDonations: number
  eligible: boolean
  avatarSeed: string
}

export interface BloodRequest {
  id: string
  department: Department
  patientId: string
  bloodType: BloodGroup
  unitsRequested: number
  urgency: RequestUrgency
  status: RequestStatus
  requestedAt: string
  requestedBy: string
}

export const DONORS: Donor[] = []
export const BLOOD_UNITS: BloodUnit[] = []
export const BLOOD_REQUESTS: BloodRequest[] = []

export function getDonorById(donorId: string): Donor | undefined {
  return DONORS.find((d) => d.id === donorId)
}

/**
 * Standard ABO/Rh compatibility: which donor blood types a given recipient
 * type can safely receive from.
 */
export const RECEIVE_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  "O-": ["O-"],
  "O+": ["O+", "O-"],
  "A-": ["A-", "O-"],
  "A+": ["A+", "A-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
  "AB+": ["AB+", "AB-", "A+", "A-", "B+", "B-", "O+", "O-"],
}

export function compatibleDonorTypes(recipient: BloodGroup): BloodGroup[] {
  return RECEIVE_COMPATIBILITY[recipient]
}
