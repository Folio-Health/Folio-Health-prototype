export type Gender = "Male" | "Female" | "Other"

export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-"

export const CLINICAL_ROLES = [
  "Administrator",
  "Receptionist",
  "Doctor",
  "Nurse",
  "Lab Scientist",
  "Radiologist",
  "Pharmacist",
  "Accountant",
  "Hospital Management",
] as const

export type ClinicalRole = (typeof CLINICAL_ROLES)[number]

export const DEPARTMENTS = [
  "General Medicine",
  "Cardiology",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Orthopedics",
  "Neurology",
  "Oncology",
  "Dermatology",
  "ENT",
  "Ophthalmology",
  "Psychiatry",
  "Emergency Medicine",
  "Radiology",
  "Laboratory",
  "Pharmacy",
  "Surgery",
  "Intensive Care Unit",
  "Nephrology",
  "Urology",
  "Administration",
] as const

export type Department = (typeof DEPARTMENTS)[number]

export interface Address {
  line1: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
}

export interface InsuranceInfo {
  provider: string
  policyNumber: string
  plan: string
  validTill: string
}

export interface StaffMember {
  id: string
  staffId: string
  name: string
  role: ClinicalRole
  department: Department
  title: string
  email: string
  phone: string
  avatarSeed: string
  status: "Active" | "On Leave" | "Inactive"
  shift: "Morning" | "Evening" | "Night"
  joinedAt: string
  licenseNo?: string
  bio?: string
}

export type PatientStatus = "Active" | "Inactive" | "Archived" | "Deceased"

export interface Patient {
  id: string
  mrn: string
  name: string
  firstName: string
  lastName: string
  gender: Gender
  dob: string
  age: number
  bloodGroup: BloodGroup
  phone: string
  email: string
  address: Address
  avatarSeed: string
  status: PatientStatus
  registeredAt: string
  lastVisit: string
  primaryDoctorId: string
  department: Department
  allergies: string[]
  chronicConditions: string[]
  emergencyContact: EmergencyContact
  insurance: InsuranceInfo
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed"
  occupation: string
  height: number
  weight: number
}

export type AppointmentStatus =
  | "Scheduled"
  | "Checked In"
  | "In Progress"
  | "Completed"
  | "Cancelled"
  | "No Show"

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  department: Department
  date: string
  startTime: string
  endTime: string
  type: "New Visit" | "Follow-up" | "Consultation" | "Procedure" | "Telehealth"
  status: AppointmentStatus
  reason: string
  notes?: string
}

export interface VitalReading {
  id: string
  patientId: string
  recordedAt: string
  recordedBy: string
  bpSystolic: number
  bpDiastolic: number
  pulse: number
  temperature: number
  respiratoryRate: number
  spo2: number
  weight: number
  height: number
  bmi: number
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "critical"
  read: boolean
  createdAt: string
  href?: string
}
