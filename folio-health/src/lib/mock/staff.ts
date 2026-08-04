import { faker } from "@faker-js/faker"
import { seedFaker, pick, id } from "./seed"
import type { ClinicalRole, Department, StaffMember } from "@/types/core"

seedFaker(1)

const TITLES: Record<ClinicalRole, string[]> = {
  Doctor: [
    "Consultant Physician",
    "Senior Consultant",
    "Resident Doctor",
    "Specialist Physician",
    "Attending Physician",
  ],
  Nurse: [
    "Staff Nurse",
    "Senior Nurse",
    "Nurse Practitioner",
    "Charge Nurse",
    "Ward Nurse",
  ],
  "Lab Scientist": ["Medical Laboratory Scientist", "Lab Technologist", "Pathology Technician"],
  Radiologist: ["Consultant Radiologist", "Radiographer", "Imaging Specialist"],
  Pharmacist: ["Chief Pharmacist", "Clinical Pharmacist", "Pharmacy Technician"],
  Receptionist: ["Front Desk Officer", "Patient Registration Officer", "Reception Supervisor"],
  Accountant: ["Senior Accountant", "Billing Officer", "Finance Officer"],
  Administrator: ["System Administrator", "IT Administrator", "Records Administrator"],
  "Hospital Management": ["Chief Medical Officer", "Hospital Director", "Operations Manager"],
}

const CLINICAL_DEPTS: Department[] = [
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
  "Nephrology",
  "Urology",
]

const ROLE_COUNTS: { role: ClinicalRole; count: number }[] = [
  { role: "Doctor", count: 26 },
  { role: "Nurse", count: 22 },
  { role: "Lab Scientist", count: 6 },
  { role: "Radiologist", count: 4 },
  { role: "Pharmacist", count: 5 },
  { role: "Receptionist", count: 6 },
  { role: "Accountant", count: 4 },
  { role: "Administrator", count: 3 },
  { role: "Hospital Management", count: 3 },
]

function departmentForRole(role: ClinicalRole): Department {
  switch (role) {
    case "Doctor":
    case "Nurse":
      return pick(CLINICAL_DEPTS)
    case "Lab Scientist":
      return "Laboratory"
    case "Radiologist":
      return "Radiology"
    case "Pharmacist":
      return "Pharmacy"
    default:
      return "Administration"
  }
}

function buildStaff(): StaffMember[] {
  const staff: StaffMember[] = []
  let counter = 1

  for (const { role, count } of ROLE_COUNTS) {
    for (let i = 0; i < count; i++) {
      const gender = faker.person.sexType()
      const firstName = faker.person.firstName(gender)
      const lastName = faker.person.lastName()
      const namePrefix = role === "Doctor" ? "Dr. " : ""
      const name = `${namePrefix}${firstName} ${lastName}`
      const department = departmentForRole(role)
      const shift = pick(["Morning", "Evening", "Night"] as const)
      const status = faker.number.float({ min: 0, max: 1 }) > 0.06 ? "Active" : "On Leave"

      staff.push({
        id: id("STF", counter),
        staffId: `EMP-${String(counter).padStart(5, "0")}`,
        name,
        role,
        department,
        title: pick(TITLES[role]),
        email: `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, "") + "@foliohealth.example",
        phone: faker.phone.number({ style: "international" }),
        avatarSeed: name,
        status,
        shift,
        joinedAt: faker.date.past({ years: 8 }).toISOString(),
        licenseNo:
          role === "Doctor" || role === "Nurse" || role === "Pharmacist"
            ? `LIC-${faker.string.alphanumeric({ length: 8, casing: "upper" })}`
            : undefined,
        bio: faker.person.bio(),
      })
      counter++
    }
  }

  return staff
}

export const STAFF: StaffMember[] = buildStaff()

export const DOCTORS = STAFF.filter((s) => s.role === "Doctor")
export const NURSES = STAFF.filter((s) => s.role === "Nurse")

export function getStaffById(staffId: string): StaffMember | undefined {
  return STAFF.find((s) => s.id === staffId)
}

export function getStaffByRole(role: ClinicalRole): StaffMember[] {
  return STAFF.filter((s) => s.role === role)
}
