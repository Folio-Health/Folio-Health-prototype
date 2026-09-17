import { expect, test, type Page } from "@playwright/test"
import { expectToast, pickOption, signIn } from "./fixtures/app"
import {
  createPatient,
  deactivateUser,
  deletePatientGraph,
  ensureFacility,
  provisionUser,
  search,
  type Facility,
  type TestPatient,
  type TestUser,
} from "./fixtures/medplum"

/**
 * Scheduling: book → double-booking refused → check in (opens the visit) →
 * undo → check in → fulfil; cancel keeps the record with its reason.
 */

let facility: Facility
let frontDesk: TestUser
let doctor: TestUser
let patient: TestPatient

test.describe.configure({ mode: "serial" })

test.beforeAll(async () => {
  facility = await ensureFacility()
  ;[frontDesk, doctor] = await Promise.all([provisionUser("front-desk", facility), provisionUser("doctor", facility)])
  patient = await createPatient(facility, { given: "Bola", family: `Appt${Date.now().toString(36)}` })
})

test.afterAll(async () => {
  await deletePatientGraph(patient.id)
  await deactivateUser(frontDesk)
  await deactivateUser(doctor)
})

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

async function book(page: Page, time: string, reason: string) {
  await page.getByRole("button", { name: "New Appointment" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByPlaceholder("Name, phone number, or NIN…").fill(patient.phone)
  await dialog.getByRole("button", { name: patient.name }).click()
  await dialog.getByRole("combobox").first().click()
  await pickOption(page, doctor.name)
  await dialog.locator("#apt-date").fill(today())
  await dialog.locator("#apt-time").fill(time)
  await dialog.locator("#apt-reason").fill(reason)
  await dialog.getByRole("button", { name: "Book appointment" }).click()
}

test("front desk books, and double-booking the doctor is refused", async ({ page }) => {
  await signIn(page, frontDesk)
  await page.goto("/appointments")

  await book(page, "10:00", "Follow-up")
  await expectToast(page, "Appointment booked")
  const row = page.locator("div").filter({ hasText: patient.name }).filter({ hasText: "Follow-up" }).last()
  await expect(row.getByText("Booked")).toBeVisible()

  await book(page, "10:15", "Overlap attempt")
  await expectToast(page, /already has an appointment/i)
  await page.keyboard.press("Escape")
})

test("check-in opens the visit; undo cancels it; fulfil is terminal", async ({ page }) => {
  await signIn(page, frontDesk)
  await page.goto("/appointments")

  await page.getByRole("button", { name: "Check in" }).first().click()
  await expectToast(page, /checked in/i)
  await expect(page.getByText("Arrived").first()).toBeVisible()

  const [appointment] = await search<{ id?: string }>(`Appointment?actor=Patient/${patient.id}&status=arrived`)
  expect(appointment?.id).toBeTruthy()
  let visits = await search<{ status?: string }>(`Encounter?appointment=Appointment/${appointment.id}`)
  expect(visits.map((v) => v.status)).toContain("arrived")

  await page.getByRole("button", { name: "Undo check-in" }).first().click()
  await expectToast(page, /undone/i)
  visits = await search<{ status?: string }>(`Encounter?appointment=Appointment/${appointment.id}`)
  expect(visits.every((v) => v.status === "cancelled")).toBe(true)

  await page.getByRole("button", { name: "Check in" }).first().click()
  await expectToast(page, /checked in/i)
  await page.getByRole("button", { name: "Fulfil" }).first().click()
  await expectToast(page, /fulfilled/i)
  await expect(page.getByText("Fulfilled").first()).toBeVisible()

  const [fulfilled] = await search<{ status?: string }>(`Appointment?_id=${appointment.id}`)
  expect(fulfilled.status).toBe("fulfilled")
})

test("cancelling keeps the appointment on the record with its reason", async ({ page }) => {
  await signIn(page, frontDesk)
  await page.goto("/appointments")

  await book(page, "11:30", "Cancel me")
  await expectToast(page, "Appointment booked")

  await page.getByRole("button", { name: "Cancel", exact: true }).last().click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByText("Cancel appointment")).toBeVisible()
  await dialog.getByRole("button", { name: "Cancel appointment" }).click()
  await expectToast(page, /cancelled/i)
  await expect(page.getByText("Patient request").first()).toBeVisible()

  const cancelled = await search<{ status?: string; cancelationReason?: { text?: string } }>(
    `Appointment?actor=Patient/${patient.id}&status=cancelled`
  )
  expect(cancelled.some((a) => a.cancelationReason?.text === "Patient request")).toBe(true)
})

test("a doctor sees the schedule but has no scheduling actions", async ({ page }) => {
  await signIn(page, doctor)
  await page.goto("/appointments")
  await expect(page.getByText(patient.name).first()).toBeVisible()
  await expect(page.getByRole("button", { name: "New Appointment" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Check in" })).toHaveCount(0)
})
