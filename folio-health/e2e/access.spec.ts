import { expect, test } from "@playwright/test"
import { signIn } from "./fixtures/app"
import {
  createPatient,
  deactivateUser,
  deletePatientGraph,
  ensureFacility,
  provisionUser,
  svc,
  type Facility,
  type TestPatient,
  type TestUser,
} from "./fixtures/medplum"

/**
 * Role boundaries — the things a role must NOT be able to do, checked both
 * in the UI (route guard, missing actions) and at the API (a facility user's
 * own token cannot write to the compartment-scoped record directly).
 */

let facility: Facility
let frontDesk: TestUser
let lab: TestUser
let doctor: TestUser
let patient: TestPatient
let appointmentId: string
let prescriptionId: string

test.beforeAll(async () => {
  facility = await ensureFacility()
  ;[frontDesk, lab, doctor] = await Promise.all([
    provisionUser("front-desk", facility),
    provisionUser("lab-scientist", facility),
    provisionUser("doctor", facility),
  ])
  patient = await createPatient(facility, { given: "Uche", family: `Access${Date.now().toString(36)}` })
  const stamp = { meta: { account: { reference: facility.reference, display: facility.display } } }
  const start = new Date()
  start.setHours(14, 0, 0, 0)
  const appt = await svc<{ id?: string }>("fhir/R4/Appointment", {
    method: "POST",
    body: JSON.stringify({
      resourceType: "Appointment",
      status: "booked",
      start: start.toISOString(),
      end: new Date(start.getTime() + 30 * 60_000).toISOString(),
      participant: [
        { actor: { reference: `Patient/${patient.id}`, display: patient.name }, status: "accepted" },
        { actor: { reference: `Practitioner/${doctor.practitionerId}`, display: doctor.name }, status: "accepted" },
      ],
      ...stamp,
    }),
  })
  appointmentId = appt.body.id as string
  const rx = await svc<{ id?: string }>("fhir/R4/MedicationRequest", {
    method: "POST",
    body: JSON.stringify({
      resourceType: "MedicationRequest",
      status: "active",
      intent: "order",
      medicationCodeableConcept: { text: "Paracetamol 500 mg" },
      subject: { reference: `Patient/${patient.id}`, display: patient.name },
      dosageInstruction: [{ text: "1 tablet 8 hourly" }],
      ...stamp,
    }),
  })
  prescriptionId = rx.body.id as string
})

test.afterAll(async () => {
  await deletePatientGraph(patient.id)
  for (const u of [frontDesk, lab, doctor]) await deactivateUser(u)
})

test("front desk cannot open the consultation module", async ({ page }) => {
  await signIn(page, frontDesk)
  await page.goto("/consultation")
  await expect(page.getByText("You don't have permission to access this section")).toBeVisible()
})

test("lab scientist cannot open the consultation module or the patient roster", async ({ page }) => {
  await signIn(page, lab)
  await page.goto("/consultation")
  await expect(page.getByText("You don't have permission to access this section")).toBeVisible()
  await page.goto("/patients")
  await expect(page.getByText("You don't have permission to access this section")).toBeVisible()
})

test("a doctor sees the pharmacy queue but cannot dispense", async ({ page }) => {
  await signIn(page, doctor)
  await page.goto("/pharmacy")
  await expect(page.getByText("Paracetamol 500 mg").first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Dispense", exact: true })).toHaveCount(0)
})

test("a facility user's own token cannot write an appointment directly", async ({ page }) => {
  await signIn(page, frontDesk)
  // The browser session's cookies ride along with page.request.
  const current = await page.request.get(`/api/fhir/Appointment/${appointmentId}`)
  expect(current.status()).toBe(200)
  const direct = await page.request.put(`/api/fhir/Appointment/${appointmentId}`, {
    data: { ...(await current.json()), status: "arrived" },
  })
  expect(direct.status()).toBe(403)

  // …while the server route, which enforces the state machine, accepts it.
  const viaRoute = await page.request.patch(`/api/appointments/${appointmentId}`, { data: { action: "check-in" } })
  expect(viaRoute.status()).toBe(200)
  const illegal = await page.request.patch(`/api/appointments/${appointmentId}`, { data: { action: "no-show" } })
  expect(illegal.status()).toBe(409)
})

test("a nurse-only action is refused for the wrong role at the API", async ({ page }) => {
  await signIn(page, frontDesk)
  const attempt = await page.request.post("/api/dispense", { data: { medicationRequestId: prescriptionId } })
  expect(attempt.status()).toBe(403)
})
