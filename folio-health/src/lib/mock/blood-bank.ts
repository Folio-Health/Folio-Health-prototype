import { faker } from "@faker-js/faker"
import { addDays, differenceInCalendarDays, subDays } from "date-fns"
import { seedFaker, pick, pickWeighted, id } from "./seed"
import { PATIENTS } from "./patients"
import { DEPARTMENTS, type BloodGroup, type Department } from "@/types/core"

seedFaker(8)

export const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export type BloodComponent = "Whole Blood" | "Plasma" | "Platelets" | "RBC"
export type UnitStatus = "Available" | "Reserved" | "Expiring Soon" | "Expired" | "Used"
export type ExpiryStatus = "Fresh" | "Expiring" | "Expired"
export type RequestUrgency = "Routine" | "Urgent" | "Emergency"
export type RequestStatus = "Pending" | "Approved" | "Fulfilled" | "Rejected"

const SHELF_LIFE_DAYS: Record<BloodComponent, number> = {
  "Whole Blood": 35,
  RBC: 42,
  Platelets: 5,
  Plasma: 365,
}

const COMPONENTS: BloodComponent[] = ["Whole Blood", "Plasma", "Platelets", "RBC"]

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

function buildDonors(count: number): Donor[] {
  const donors: Donor[] = []
  for (let i = 1; i <= count; i++) {
    const gender = faker.person.sexType()
    const firstName = faker.person.firstName(gender)
    const lastName = faker.person.lastName()
    const hasDonatedBefore = faker.number.float({ min: 0, max: 1 }) > 0.12
    const lastDonationDate = hasDonatedBefore
      ? subDays(new Date(), faker.number.int({ min: 5, max: 400 })).toISOString()
      : null
    const daysSince = lastDonationDate ? differenceInCalendarDays(new Date(), new Date(lastDonationDate)) : null

    donors.push({
      id: id("DNR", i),
      name: `${firstName} ${lastName}`,
      bloodType: pick(BLOOD_GROUPS),
      gender: gender === "male" ? "Male" : "Female",
      phone: faker.phone.number({ style: "international" }),
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      lastDonationDate,
      totalDonations: hasDonatedBefore ? faker.number.int({ min: 1, max: 24 }) : 0,
      eligible: daysSince === null || daysSince >= 90,
      avatarSeed: `${firstName} ${lastName}`,
    })
  }
  return donors
}

function buildUnits(count: number, donors: Donor[]): BloodUnit[] {
  const units: BloodUnit[] = []
  for (let i = 1; i <= count; i++) {
    const component = pick(COMPONENTS)
    const bloodType = pick(BLOOD_GROUPS)
    const shelfLife = SHELF_LIFE_DAYS[component]
    // Spread collection dates so expiry dates land anywhere from well-expired to far-fresh.
    const collectedDate = subDays(new Date(), faker.number.int({ min: 0, max: shelfLife + 20 }))
    const expiryDate = addDays(collectedDate, shelfLife)
    const daysToExpiry = differenceInCalendarDays(expiryDate, new Date())

    let expiryStatus: ExpiryStatus
    if (daysToExpiry < 0) expiryStatus = "Expired"
    else if (daysToExpiry <= 7) expiryStatus = "Expiring"
    else expiryStatus = "Fresh"

    let status: UnitStatus
    if (expiryStatus === "Expired") status = "Expired"
    else if (expiryStatus === "Expiring") status = "Expiring Soon"
    else {
      status = pickWeighted<UnitStatus>([
        { value: "Available", weight: 65 },
        { value: "Reserved", weight: 22 },
        { value: "Used", weight: 13 },
      ])
    }

    units.push({
      id: id("BU", i),
      bloodType,
      component,
      collectedDate: collectedDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      status,
      expiryStatus,
      daysToExpiry,
      donorId: pick(donors).id,
      volumeMl: component === "Platelets" ? 250 : component === "Plasma" ? 220 : 450,
    })
  }
  return units.sort((a, b) => a.daysToExpiry - b.daysToExpiry)
}

function buildRequests(count: number): BloodRequest[] {
  const requests: BloodRequest[] = []
  for (let i = 1; i <= count; i++) {
    const patient = pick(PATIENTS)
    requests.push({
      id: id("BRQ", i),
      department: pick(REQUESTING_DEPTS),
      patientId: patient.id,
      bloodType: pick(BLOOD_GROUPS),
      unitsRequested: faker.number.int({ min: 1, max: 6 }),
      urgency: pickWeighted<RequestUrgency>([
        { value: "Routine", weight: 55 },
        { value: "Urgent", weight: 30 },
        { value: "Emergency", weight: 15 },
      ]),
      status: pickWeighted<RequestStatus>([
        { value: "Pending", weight: 30 },
        { value: "Approved", weight: 25 },
        { value: "Fulfilled", weight: 35 },
        { value: "Rejected", weight: 10 },
      ]),
      requestedAt: subDays(new Date(), faker.number.int({ min: 0, max: 21 })).toISOString(),
      requestedBy: faker.person.fullName({ sex: faker.person.sexType() }),
    })
  }
  return requests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
}

export const DONORS: Donor[] = buildDonors(25)
export const BLOOD_UNITS: BloodUnit[] = buildUnits(40, DONORS)
export const BLOOD_REQUESTS: BloodRequest[] = buildRequests(15)

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
