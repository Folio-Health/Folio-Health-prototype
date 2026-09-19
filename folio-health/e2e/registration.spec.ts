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
  await page.getByLabel("Blood group").click()
  await pickOption(page, /^O\+$/)
  await page.getByLabel("Occupation").fill("Teacher")
  await page.getByLabel("National Identification Number (NIN)").fill(nin)
  // §4.1 biodata: ethnicity and religion are required, captured for clinical
  // reasons. The VNIN (§2) is optional, so this path leaves it empty.
  await page.getByLabel("Ethnicity / tribe").click()
  await pickOption(page, "Igbo")
  await page.getByLabel("Religion").click()
  await pickOption(page, "Christianity")
  await page.getByRole("button", { name: "Next", exact: true }).click()

  // Step 2 — contact & address
  await page.getByLabel("Phone number").fill(`070${String(Date.now()).slice(-8)}`)
  await page.getByLabel("Email address").fill(`amaka.${stamp}@example.com`)
  await page.getByLabel("Street address").fill("12 Unity Road")
  await page.getByLabel("City").fill("Abeokuta")
  await page.getByLabel("State").fill("Ogun")
  await page.getByLabel("Postal code").fill("110001")
  await page.getByLabel("Country").fill("Nigeria")
  await page.getByRole("button", { name: "Next", exact: true }).click()

  // Step 3 — next of kin
  await page.getByLabel("Next of kin full name").fill("Chidi Okafor")
  await page.getByLabel("Relationship").click()
  await pickOption(page, "Sibling")
  await page.getByLabel("Phone number").fill("08011122233")
  await page.getByRole("button", { name: "Next", exact: true }).click()

  // Step 4 — visit details (§4.1). Date and time of presentation are
  // prefilled from the clock and the referral source defaults to
  // self-referral, so this path only has to move on.
  await expect(page.getByLabel("Date of presentation")).not.toHaveValue("")
  await page.getByRole("button", { name: "Next", exact: true }).click()

  // Step 5 — insurance: self pay
  await page.getByRole("checkbox").first().click()
  await page.getByRole("button", { name: "Next", exact: true }).click()

  // Step 6 — review
  await expect(page.getByText("Age", { exact: true })).toBeVisible()
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
