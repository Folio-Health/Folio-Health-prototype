import { faker } from "@faker-js/faker"
import { seedFaker, pick, pickWeighted, id } from "@/lib/mock/seed"
import { PATIENTS } from "@/lib/mock/patients"
import { DOCTORS, NURSES } from "@/lib/mock/staff"
import type { Patient, StaffMember } from "@/types/core"

seedFaker(30)

export type BedStatus = "Available" | "Occupied" | "Reserved" | "Cleaning"
export type AdmissionStatus = "Admitted" | "Discharged"
export type TransferStatus = "Pending" | "Approved" | "Completed"
export type ICUStatus = "Critical" | "Stable" | "Improving"
export type TheatreBookingStatus = "Scheduled" | "In Progress" | "Completed"

export interface Ward {
  id: string
  name: string
  department: string
  capacity: number
  headNurseId: string
}

export interface Bed {
  id: string
  wardId: string
  label: string
  status: BedStatus
}

export interface Admission {
  id: string
  patientId: string
  wardId: string
  bedId: string
  doctorId: string
  admissionDate: string
  diagnosis: string
  status: AdmissionStatus
  dischargeDate?: string
  readyForDischarge?: boolean
  dischargeSummaryReady?: boolean
}

export interface Transfer {
  id: string
  patientId: string
  fromWardId: string
  fromBedId: string
  toWardId: string
  toBedId: string
  requestedBy: string
  reason: string
  date: string
  status: TransferStatus
}

export interface ICUPatient {
  admissionId: string
  patientId: string
  bedId: string
  status: ICUStatus
  onVentilator: boolean
  vitals: { hr: number; bp: string; spo2: number; temp: number }
}

export interface TheatreBooking {
  id: string
  theatreNumber: number
  procedure: string
  surgeonId: string
  time: string
  status: TheatreBookingStatus
}

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

const WARD_DEFS: { name: string; department: string; capacity: number }[] = [
  { name: "General Ward", department: "General Medicine", capacity: 24 },
  { name: "ICU", department: "Intensive Care Unit", capacity: 10 },
  { name: "Maternity", department: "Obstetrics & Gynecology", capacity: 12 },
  { name: "Pediatric Ward", department: "Pediatrics", capacity: 14 },
  { name: "Private Rooms", department: "General Medicine", capacity: 8 },
  { name: "Orthopedic Ward", department: "Orthopedics", capacity: 10 },
]

const WARDS: Ward[] = WARD_DEFS.map((w, i) => ({
  id: id("WARD", i + 1),
  name: w.name,
  department: w.department,
  capacity: w.capacity,
  headNurseId: pick(NURSES).id,
}))

const WARD_PREFIX: Record<string, string> = {
  "General Ward": "GW",
  ICU: "ICU",
  Maternity: "MAT",
  "Pediatric Ward": "PED",
  "Private Rooms": "PR",
  "Orthopedic Ward": "ORT",
}

const BEDS: Bed[] = []
for (const ward of WARDS) {
  const prefix = WARD_PREFIX[ward.name]
  for (let i = 1; i <= ward.capacity; i++) {
    BEDS.push({
      id: id("BED", BEDS.length + 1),
      wardId: ward.id,
      label: `${prefix}-${String(i).padStart(2, "0")}`,
      status: pickWeighted([
        { value: "Occupied" as BedStatus, weight: 55 },
        { value: "Available" as BedStatus, weight: 28 },
        { value: "Reserved" as BedStatus, weight: 7 },
        { value: "Cleaning" as BedStatus, weight: 10 },
      ]),
    })
  }
}

const DIAGNOSES = [
  "Community acquired pneumonia",
  "Acute appendicitis (post op)",
  "Congestive heart failure exacerbation",
  "Diabetic ketoacidosis",
  "Stroke (ischemic)",
  "Hip fracture (post op)",
  "Sepsis",
  "COPD exacerbation",
  "Acute kidney injury",
  "Postpartum recovery",
  "Preeclampsia observation",
  "Febrile seizure (pediatric)",
  "Gastroenteritis with dehydration",
  "Road traffic accident polytrauma",
  "Myocardial infarction (post PCI)",
  "Cellulitis",
  "Bowel obstruction (post op)",
  "Chronic kidney disease flare",
]

// Shuffle a working copy of patients so each admission gets a unique person.
const shuffledPatients: Patient[] = faker.helpers.shuffle([...PATIENTS])
let patientCursor = 0
function nextPatient(): Patient {
  const p = shuffledPatients[patientCursor % shuffledPatients.length]
  patientCursor++
  return p
}

const ADMISSIONS: Admission[] = []

// One active admission per occupied bed.
for (const bed of BEDS) {
  if (bed.status !== "Occupied") continue
  const patient = nextPatient()
  const admittedDaysAgo = faker.number.int({ min: 0, max: 12 })
  const admissionDate =
    admittedDaysAgo === 0
      ? faker.date.recent({ days: 1 })
      : faker.date.recent({ days: admittedDaysAgo, refDate: faker.date.recent({ days: admittedDaysAgo }) })
  const readyForDischarge = faker.number.float({ min: 0, max: 1 }) > 0.78
  ADMISSIONS.push({
    id: id("ADM", ADMISSIONS.length + 1),
    patientId: patient.id,
    wardId: bed.wardId,
    bedId: bed.id,
    doctorId: pick(DOCTORS).id,
    admissionDate: admissionDate.toISOString(),
    diagnosis: pick(DIAGNOSES),
    status: "Admitted",
    readyForDischarge,
    dischargeSummaryReady: readyForDischarge ? faker.datatype.boolean() : false,
  })
}

// Force a handful of admissions dated "today" so the "Today's Admissions" stat is meaningful.
for (let i = 0; i < Math.min(5, ADMISSIONS.length); i++) {
  ADMISSIONS[i] = {
    ...ADMISSIONS[i],
    admissionDate: faker.date.recent({ days: 1 }).toISOString(),
  }
}

// A batch of historical, already-discharged admissions (not tied to a current bed).
const dischargedWard = () => pick(WARDS)
for (let i = 0; i < 24; i++) {
  const patient = nextPatient()
  const ward = dischargedWard()
  const admissionDate = faker.date.recent({ days: 21 })
  const dischargeDate =
    i < 6
      ? faker.date.recent({ days: 1 })
      : faker.date.soon({ days: 5, refDate: admissionDate })
  ADMISSIONS.push({
    id: id("ADM", ADMISSIONS.length + 1),
    patientId: patient.id,
    wardId: ward.id,
    bedId: pick(BEDS.filter((b) => b.wardId === ward.id)).id,
    doctorId: pick(DOCTORS).id,
    admissionDate: admissionDate.toISOString(),
    diagnosis: pick(DIAGNOSES),
    status: "Discharged",
    dischargeDate: dischargeDate.toISOString(),
    dischargeSummaryReady: true,
  })
}

const TRANSFER_REASONS = [
  "Requires higher level of monitoring",
  "Step down from ICU",
  "Bed reallocation for isolation",
  "Closer to specialist care unit",
  "Patient/family request",
  "Overflow from full ward",
  "Postoperative recovery placement",
]

const TRANSFERS: Transfer[] = Array.from({ length: 15 }).map((_, i) => {
  const admission = pick(ADMISSIONS.filter((a) => a.status === "Admitted"))
  const fromWard = WARDS.find((w) => w.id === admission.wardId)!
  const toWard = pick(WARDS.filter((w) => w.id !== fromWard.id))
  return {
    id: id("TRF", i + 1),
    patientId: admission.patientId,
    fromWardId: fromWard.id,
    fromBedId: admission.bedId,
    toWardId: toWard.id,
    toBedId: pick(BEDS.filter((b) => b.wardId === toWard.id)).id,
    requestedBy: pick(DOCTORS).name,
    reason: pick(TRANSFER_REASONS),
    date: faker.date.recent({ days: 6 }).toISOString(),
    status: pickWeighted([
      { value: "Pending" as TransferStatus, weight: 4 },
      { value: "Approved" as TransferStatus, weight: 3 },
      { value: "Completed" as TransferStatus, weight: 6 },
    ]),
  }
})

const icuWard = WARDS.find((w) => w.name === "ICU")!
const ICU_PATIENTS: ICUPatient[] = BEDS.filter(
  (b) => b.wardId === icuWard.id && b.status === "Occupied"
).map((bed) => {
  const admission = ADMISSIONS.find((a) => a.bedId === bed.id && a.status === "Admitted")!
  const status = pickWeighted([
    { value: "Critical" as ICUStatus, weight: 3 },
    { value: "Stable" as ICUStatus, weight: 5 },
    { value: "Improving" as ICUStatus, weight: 4 },
  ])
  return {
    admissionId: admission.id,
    patientId: admission.patientId,
    bedId: bed.id,
    status,
    onVentilator: status === "Critical" ? faker.number.float({ min: 0, max: 1 }) > 0.3 : false,
    vitals: {
      hr: faker.number.int({ min: 55, max: 135 }),
      bp: `${faker.number.int({ min: 85, max: 160 })}/${faker.number.int({ min: 50, max: 100 })}`,
      spo2: faker.number.int({ min: 86, max: 100 }),
      temp: Number(faker.number.float({ min: 36, max: 39.5, fractionDigits: 1 }).toFixed(1)),
    },
  }
})

const PROCEDURES = [
  "Appendectomy",
  "Cesarean Section",
  "Hip Replacement",
  "Cholecystectomy",
  "Coronary Angioplasty",
  "Hernia Repair",
  "Tonsillectomy",
  "Cataract Surgery",
  "Fracture Fixation",
  "Exploratory Laparotomy",
]

const THEATRE_BOOKINGS: TheatreBooking[] = Array.from({ length: 8 }).map((_, i) => {
  const hour = 7 + i
  return {
    id: id("TB", i + 1),
    theatreNumber: (i % 6) + 1,
    procedure: pick(PROCEDURES),
    surgeonId: pick(DOCTORS).id,
    time: `${String(hour).padStart(2, "0")}:${pick(["00", "30"])}`,
    status: pickWeighted([
      { value: "Scheduled" as TheatreBookingStatus, weight: 5 },
      { value: "In Progress" as TheatreBookingStatus, weight: 2 },
      { value: "Completed" as TheatreBookingStatus, weight: 3 },
    ]),
  }
})

export const WARDS_LIST = WARDS
export const BEDS_LIST = BEDS
export const ADMISSIONS_LIST = ADMISSIONS
export const TRANSFERS_LIST = TRANSFERS
export const ICU_PATIENTS_LIST = ICU_PATIENTS
export const THEATRE_BOOKINGS_LIST = THEATRE_BOOKINGS

export function getWardById(wardId: string): Ward | undefined {
  return WARDS.find((w) => w.id === wardId)
}

export function getBedById(bedId: string): Bed | undefined {
  return BEDS.find((b) => b.id === bedId)
}

export function getBedsByWard(wardId: string): Bed[] {
  return BEDS.filter((b) => b.wardId === wardId)
}

export function getAdmissionByBedId(bedId: string): Admission | undefined {
  return ADMISSIONS.find((a) => a.bedId === bedId && a.status === "Admitted")
}

export function getActiveAdmissions(): Admission[] {
  return ADMISSIONS.filter((a) => a.status === "Admitted")
}

export function getHeadNurse(ward: Ward): StaffMember | undefined {
  return NURSES.find((n) => n.id === ward.headNurseId)
}

export function occupiedBedsCount(): number {
  return BEDS.filter((b) => b.status === "Occupied").length
}

export function availableBedsCount(): number {
  return BEDS.filter((b) => b.status === "Available").length
}

export function reservedBedsCount(): number {
  return BEDS.filter((b) => b.status === "Reserved").length
}

export function cleaningBedsCount(): number {
  return BEDS.filter((b) => b.status === "Cleaning").length
}

export function todaysAdmissionsCount(): number {
  return ADMISSIONS.filter((a) => isToday(a.admissionDate)).length
}

export function todaysDischargesCount(): number {
  return ADMISSIONS.filter((a) => a.status === "Discharged" && a.dischargeDate && isToday(a.dischargeDate)).length
}

export function averageLengthOfStay(): number {
  const discharged = ADMISSIONS.filter((a) => a.status === "Discharged" && a.dischargeDate)
  if (discharged.length === 0) return 0
  const totalDays = discharged.reduce((sum, a) => {
    const start = new Date(a.admissionDate).getTime()
    const end = new Date(a.dischargeDate!).getTime()
    return sum + Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
  }, 0)
  return Math.round((totalDays / discharged.length) * 10) / 10
}

export function getPendingDischarges(): Admission[] {
  return ADMISSIONS.filter((a) => a.status === "Admitted" && a.readyForDischarge)
}

export function getAdmissionById(admissionId: string): Admission | undefined {
  return ADMISSIONS.find((a) => a.id === admissionId)
}

export { isToday }
