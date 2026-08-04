import { faker } from "@faker-js/faker"
import { seedFaker, pick, id } from "./seed"
import type { BloodGroup, Department, Patient } from "@/types/core"
import { DEPARTMENTS } from "@/types/core"
import { DOCTORS } from "./staff"

seedFaker(2)

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

const ALLERGIES = [
  "Penicillin",
  "Peanuts",
  "Latex",
  "Aspirin",
  "Sulfa Drugs",
  "Shellfish",
  "Pollen",
  "Ibuprofen",
  "Iodine",
  "Bee Stings",
]

const CHRONIC_CONDITIONS = [
  "Hypertension",
  "Type 2 Diabetes",
  "Asthma",
  "Coronary Artery Disease",
  "Chronic Kidney Disease",
  "Osteoarthritis",
  "Hypothyroidism",
  "COPD",
  "Epilepsy",
]

const INSURERS = [
  "AAA Health Assurance",
  "National Health Insurance Scheme",
  "BlueShield Family Plan",
  "MediGuard Insurance",
  "Prime Health Cover",
  "SecureLife HMO",
]

const CLINICAL_DEPTS: Department[] = DEPARTMENTS.filter(
  (d) => !["Radiology", "Laboratory", "Pharmacy", "Administration", "Surgery"].includes(d)
)

function buildPatients(count: number): Patient[] {
  const patients: Patient[] = []

  for (let i = 1; i <= count; i++) {
    const gender = faker.person.sexType()
    const firstName = faker.person.firstName(gender)
    const lastName = faker.person.lastName()
    const dob = faker.date.birthdate({ min: 1, max: 92, mode: "age" })
    const age = new Date().getFullYear() - dob.getFullYear()
    const registeredAt = faker.date.past({ years: 5 })
    const height = faker.number.int({ min: 55, max: 195 })
    const weight = faker.number.int({ min: 6, max: 120 })
    const hasAllergies = faker.number.float({ min: 0, max: 1 }) > 0.55
    const hasChronic = age > 30 && faker.number.float({ min: 0, max: 1 }) > 0.5

    patients.push({
      id: id("PAT", i),
      mrn: `PT-${String(1000 + i)}`,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      gender: gender === "male" ? "Male" : "Female",
      dob: dob.toISOString(),
      age,
      bloodGroup: pick(BLOOD_GROUPS),
      phone: faker.phone.number({ style: "international" }),
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      address: {
        line1: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        postalCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
      avatarSeed: `${firstName} ${lastName}`,
      status: pick([
        "Active",
        "Active",
        "Active",
        "Active",
        "Inactive",
        "Archived",
      ] as const),
      registeredAt: registeredAt.toISOString(),
      lastVisit: faker.date.recent({ days: 120 }).toISOString(),
      primaryDoctorId: pick(DOCTORS).id,
      department: pick(CLINICAL_DEPTS),
      allergies: hasAllergies
        ? faker.helpers.arrayElements(ALLERGIES, { min: 1, max: 3 })
        : [],
      chronicConditions: hasChronic
        ? faker.helpers.arrayElements(CHRONIC_CONDITIONS, { min: 1, max: 2 })
        : [],
      emergencyContact: {
        name: faker.person.fullName(),
        relationship: pick(["Spouse", "Parent", "Sibling", "Child", "Friend"]),
        phone: faker.phone.number({ style: "international" }),
      },
      insurance: {
        provider: pick(INSURERS),
        policyNumber: faker.string.alphanumeric({ length: 10, casing: "upper" }),
        plan: pick(["Basic", "Standard", "Premium", "Family", "Corporate"]),
        validTill: faker.date.future({ years: 1 }).toISOString(),
      },
      maritalStatus: pick(["Single", "Married", "Divorced", "Widowed"] as const),
      occupation: faker.person.jobTitle(),
      height,
      weight,
    })
  }

  return patients
}

export const PATIENTS: Patient[] = buildPatients(180)

export function getPatientById(patientId: string): Patient | undefined {
  return PATIENTS.find((p) => p.id === patientId)
}

export function searchPatients(query: string): Patient[] {
  const q = query.trim().toLowerCase()
  if (!q) return PATIENTS
  return PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.email.toLowerCase().includes(q)
  )
}
