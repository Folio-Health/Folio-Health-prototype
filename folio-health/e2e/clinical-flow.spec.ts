import { expect, test } from "@playwright/test"
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
import { TEST_NAMES } from "../src/lib/mock/laboratory"

/**
 * The whole clerking sequence, one role at a time, on one real visit:
 * nurse opens the visit and takes vitals → doctor starts the consultation,
 * clerks, signs, orders a lab test, prescribes, closes the visit → lab
 * scientist results the order → doctor sees the result → pharmacist checks
 * the medication history and dispenses.
 */

let facility: Facility
let nurse: TestUser
let doctor: TestUser
let lab: TestUser
let pharmacist: TestUser
let patient: TestPatient
const labTest = TEST_NAMES[0]
const drug = "Artemether-Lumefantrine 80/480 mg"

test.describe.configure({ mode: "serial" })

test.beforeAll(async () => {
  facility = await ensureFacility()
  ;[nurse, doctor, lab, pharmacist] = await Promise.all([
    provisionUser("nurse", facility),
    provisionUser("doctor", facility),
    provisionUser("lab-scientist", facility),
    provisionUser("pharmacist", facility),
  ])
  patient = await createPatient(facility, { given: "Ngozi", family: `Clinic${Date.now().toString(36)}` })
})

test.afterAll(async () => {
  await deletePatientGraph(patient.id)
  for (const u of [nurse, doctor, lab, pharmacist]) await deactivateUser(u)
})

test("nurse opens a walk-in visit and records vital signs (triage)", async ({ page }) => {
  await signIn(page, nurse)
  await page.goto("/vitals")

  await page.getByRole("button", { name: "Open visit (walk-in)" }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByPlaceholder("Name, phone number, or NIN…").fill(patient.phone)
  await dialog.getByRole("button", { name: patient.name }).click()
  await dialog.locator("#visit-reason").fill("Fever and headache")
  await dialog.getByRole("button", { name: "Open visit" }).click()
  await expectToast(page, "Visit opened")

  await page.getByRole("button", { name: patient.name }).first().click()
  await page.locator("#vital-systolic").fill("120")
  await page.locator("#vital-diastolic").fill("80")
  await page.locator("#vital-temperature").fill("38.4")
  await page.locator("#vital-heartRate").fill("96")
  await page.getByRole("button", { name: "Record vitals" }).click()
  await expectToast(page, "Vital signs recorded")
  await expect(page.getByText("Ready for doctor").first()).toBeVisible()

  const vitals = await search<{ code?: { text?: string } }>(`Observation?patient=Patient/${patient.id}&category=vital-signs`)
  expect(vitals.length).toBeGreaterThanOrEqual(3)
  const [visit] = await search<{ status?: string }>(`Encounter?subject=Patient/${patient.id}`)
  expect(visit?.status).toBe("triaged")
})

test("doctor clerks the visit, signs, orders a test, prescribes and closes", async ({ page }) => {
  await signIn(page, doctor)
  await page.goto("/consultation")
  await page.getByRole("link", { name: new RegExp(patient.name) }).first().click()
  await page.waitForURL(/\/consultation\/[0-9a-f-]{36}$/)

  await page.getByRole("button", { name: "Start consultation" }).click()
  await expectToast(page, "Consultation started")
  await expect(page.getByText("120/80 mmHg")).toBeVisible()

  // Closing before signing must be refused.
  await page.getByRole("button", { name: "Close visit" }).click()
  await expectToast(page, /Sign the clerking note/i)

  await page.getByRole("checkbox").first().click()
  await page.getByPlaceholder("Symptom (e.g. Cough)").first().fill("Fever")
  await page.getByPlaceholder("Duration (e.g. 3 weeks)").first().fill("3 days")
  await page.locator('textarea[data-section="hpc"]').fill("High-grade fever, worse at night, with headache. No cough.")
  await page.locator('textarea[data-section="provisionalDiagnosis"]').fill("Uncomplicated malaria")
  await page.locator('textarea[data-section="managementPlan"]').fill("ACT for 3 days, paracetamol PRN, review in 3 days.")
  await page.getByRole("button", { name: "Sign note" }).click()
  await expectToast(page, "Note signed")
  await expect(page.getByText("Signed", { exact: true })).toBeVisible()

  // Order a lab test.
  await page.getByRole("button", { name: "Order", exact: true }).click()
  let dialog = page.getByRole("dialog")
  await dialog.getByRole("combobox").first().click()
  await pickOption(page, labTest)
  await dialog.locator("#order-indication").fill("Confirm malaria parasitaemia")
  await dialog.getByRole("button", { name: "Place order" }).click()
  await expectToast(page, "Order placed")
  await expect(page.getByText(labTest).first()).toBeVisible()

  // Prescribe.
  await page.getByRole("button", { name: "Prescribe", exact: true }).first().click()
  dialog = page.getByRole("dialog")
  await dialog.locator("#rx-drug").fill(drug)
  await dialog.locator("#rx-dose").fill("1 tablet")
  await dialog.locator("#rx-freq").fill("12 hourly")
  await dialog.locator("#rx-dur").fill("3 days")
  await dialog.locator("#rx-qty").fill("6")
  await dialog.getByRole("button", { name: "Prescribe", exact: true }).click()
  await expectToast(page, "Prescription written")
  await expect(page.getByText(drug).first()).toBeVisible()

  await page.getByRole("button", { name: "Close visit" }).click()
  await expectToast(page, "Visit closed")
  await page.waitForURL(/\/consultation$/)

  const [note] = await search<{ status?: string; attester?: unknown[] }>(`Composition?subject=Patient/${patient.id}`)
  expect(note?.status).toBe("final")
  expect(note?.attester?.length).toBe(1)
  const [dx] = await search<{ code?: { text?: string } }>(`Condition?subject=Patient/${patient.id}`)
  expect(dx?.code?.text).toBe("Uncomplicated malaria")
})

test("lab scientist results the order and it completes", async ({ page }) => {
  await signIn(page, lab)
  await page.goto("/laboratory")
  await expect(page.getByText(labTest).first()).toBeVisible()

  await page.getByRole("button", { name: "Enter result" }).first().click()
  const dialog = page.getByRole("dialog")
  await dialog.getByPlaceholder("Value").first().fill("Positive")
  await dialog.locator("#result-conclusion").fill("Plasmodium falciparum trophozoites seen.")
  await dialog.getByRole("button", { name: /File final result/ }).click()
  await expectToast(page, "Result filed")

  await page.getByRole("tab", { name: "Completed" }).click()
  await expect(page.getByText(patient.name).first()).toBeVisible()

  const [order] = await search<{ status?: string }>(`ServiceRequest?patient=Patient/${patient.id}`)
  expect(order?.status).toBe("completed")
  const reports = await search<{ status?: string; conclusion?: string }>(`DiagnosticReport?patient=Patient/${patient.id}`)
  expect(reports[0]?.status).toBe("final")
})

test("the doctor sees the result on the visit", async ({ page }) => {
  await signIn(page, doctor)
  await page.goto("/consultation")
  await page.getByRole("link", { name: new RegExp(patient.name) }).first().click()
  await expect(page.getByText("Plasmodium falciparum trophozoites seen.")).toBeVisible()
})

test("pharmacist reviews the medication history and dispenses", async ({ page }) => {
  await signIn(page, pharmacist)
  await page.goto("/pharmacy")
  await expect(page.getByText(drug).first()).toBeVisible()

  await page.getByRole("button", { name: "History" }).first().click()
  const sheet = page.getByRole("dialog")
  await expect(sheet.getByText("Medication history")).toBeVisible()
  await expect(sheet.getByText(drug).first()).toBeVisible()
  await page.keyboard.press("Escape")

  await page.getByRole("button", { name: "Dispense", exact: true }).first().click()
  await page.getByRole("dialog").getByRole("button", { name: "Confirm dispense" }).click()
  await expectToast(page, "Dispensed")
  await expect(page.getByText(drug)).toHaveCount(0)

  const [rx] = await search<{ status?: string }>(`MedicationRequest?patient=Patient/${patient.id}`)
  expect(rx?.status).toBe("completed")
  const dispenses = await search<{ status?: string }>(`MedicationDispense?patient=Patient/${patient.id}`)
  expect(dispenses).toHaveLength(1)
})
