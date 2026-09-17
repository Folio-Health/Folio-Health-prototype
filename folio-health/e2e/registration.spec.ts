import { expect, test, type Page } from "@playwright/test"
import { expectToast, pickOption, signIn } from "./fixtures/app"
import {
  deactivateUser,
  deletePatientGraph,
  ensureFacility,
  provisionUser,
  search,
  type Facility,
  type TestUser,
} from "./fixtures/medplum"

/**
 * Front desk registers a patient through the real wizard and lands on the
 * real record; a second registration with the same NIN is refused.
 */

let facility: Facility
let frontDesk: TestUser
const nin = `9${String(Date.now()).slice(-10)}`
const stamp = Date.now().toString(36)
const patientName = { first: "Amaka", last: `E2E${stamp}` }

test.beforeAll(async () => {
  facility = await ensureFacility()
  frontDesk = await provisionUser("front-desk", facility)
})

test.afterAll(async () => {
  const created = await search<{ id?: string }>(
    `Patient?identifier=${encodeURIComponent(`https://folio.health/fhir/sid/nin|${nin}`)}&_count=10`
  )
  for (const p of created) if (p.id) await deletePatientGraph(p.id)
  await deactivateUser(frontDesk)
})

async function fillWizard(page: Page) {
  await page.goto("/reception/register")

  // Step 1 — personal information (gender / marital status keep their defaults)
  await page.getByLabel("First name").fill(patientName.first)
  await page.getByLabel("Last name").fill(patientName.last)
  await page.getByLabel("Date of birth").fill("1993-04-12")
  // Selects on this step, in order: gender, blood group, marital status.
  await page.getByRole("combobox").nth(1).click()
  await pickOption(page, /^O\+$/)
  await page.getByLabel("Occupation").fill("Teacher")
  await page.getByLabel("National Identification Number (NIN)").fill(nin)
  await page.getByRole("button", { name: "Next" }).click()

  // Step 2 — contact & address
  await page.getByLabel("Phone number").fill(`070${String(Date.now()).slice(-8)}`)
  await page.getByLabel("Email address").fill(`amaka.${stamp}@example.com`)
  await page.getByLabel("Street address").fill("12 Unity Road")
  await page.getByLabel("City").fill("Abeokuta")
  await page.getByLabel("State").fill("Ogun")
  await page.getByLabel("Postal code").fill("110001")
  await page.getByLabel("Country").fill("Nigeria")
  await page.getByRole("button", { name: "Next" }).click()

  // Step 3 — emergency contact
  await page.getByLabel("Contact full name").fill("Chidi Okafor")
  await page.getByLabel("Relationship").fill("Brother")
  await page.getByLabel("Phone number").fill("08011122233")
  await page.getByRole("button", { name: "Next" }).click()

  // Step 4 — insurance: self pay
  await page.getByRole("checkbox").first().click()
  await page.getByRole("button", { name: "Next" }).click()

  // Step 5 — review
  await expect(page.getByText("Age")).toBeVisible()
  await expect(page.getByText(nin)).toBeVisible()
}

test("front desk registers a patient and lands on the real record", async ({ page }) => {
  await signIn(page, frontDesk)
  await fillWizard(page)
  await page.getByRole("button", { name: "Complete Registration" }).click()

  await page.waitForURL(/\/patients\/[0-9a-f-]{36}$/, { timeout: 30_000 })
  await expect(page.getByRole("heading", { name: `${patientName.first} ${patientName.last}` })).toBeVisible()

  const created = await search<{ id?: string; meta?: { account?: { reference?: string } } }>(
    `Patient?identifier=${encodeURIComponent(`https://folio.health/fhir/sid/nin|${nin}`)}`
  )
  expect(created).toHaveLength(1)
})

test("a second registration with the same NIN is refused", async ({ page }) => {
  await signIn(page, frontDesk)
  await fillWizard(page)
  await page.getByRole("button", { name: "Complete Registration" }).click()
  await expectToast(page, /already registered/i)
  await expect(page).toHaveURL(/\/reception\/register/)
})

test("front desk can view the record but not edit it", async ({ page }) => {
  const [patient] = await search<{ id?: string }>(
    `Patient?identifier=${encodeURIComponent(`https://folio.health/fhir/sid/nin|${nin}`)}`
  )
  test.skip(!patient?.id, "needs the patient from the first test")
  await signIn(page, frontDesk)
  await page.goto(`/patients/${patient.id}`)
  await expect(page.getByRole("heading", { name: `${patientName.first} ${patientName.last}` })).toBeVisible()
  await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0)
})
