/**
 * Author the AccessPolicies the clinical module needs, on the live project.
 *
 * Creates (if missing) the three role policies provisioning could not find:
 *   Folio Lab Scientist Access Policy
 *   Folio Pharmacist Access Policy
 *   Folio Billing Access Policy
 * and makes sure the nurse/doctor policies can read everything the
 * consultation flow files. Every clinical entry is facility-scoped
 * (`_compartment=%organization`) and READ-ONLY: writes go through the
 * /api/* routes with the service identity, which enforce the workflow rules.
 *
 * Directory entries (Practitioner, Organization, …) are copied from the
 * installed Front Desk policy so the shape matches what provisioning expects.
 *
 * Runs as the service account (project admin). Idempotent.
 */

import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

function loadEnv() {
  const env = {}
  for (const file of [".env", ".env.local"]) {
    let text
    try {
      text = readFileSync(join(root, file), "utf8")
    } catch {
      continue
    }
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "")
    }
  }
  return env
}

const env = loadEnv()
const baseUrl = (env.MEDPLUM_BASE_URL ?? "http://localhost:8103/").replace(/\/+$/, "")

function fail(message) {
  console.error(`\n✗ ${message}`)
  process.exit(1)
}

const tokenResponse = await fetch(`${baseUrl}/oauth2/token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.MEDPLUM_SERVICE_CLIENT_ID ?? "",
    client_secret: env.MEDPLUM_SERVICE_CLIENT_SECRET ?? "",
  }),
}).catch(() => null)
if (!tokenResponse) fail("Could not reach Medplum. Is the SSH tunnel to port 8103 up?")
const tokens = await tokenResponse.json().catch(() => ({}))
if (!tokenResponse.ok || !tokens.access_token) fail("Could not authenticate the service account.")
const auth = { Authorization: `Bearer ${tokens.access_token}` }

async function getPolicy(name) {
  const r = await fetch(`${baseUrl}/fhir/R4/AccessPolicy?name=${encodeURIComponent(name)}`, { headers: auth })
  const b = await r.json().catch(() => ({}))
  if (!r.ok) fail(`Could not read "${name}" (${r.status}). Is the service account a project admin?`)
  return b.entry?.map((e) => e.resource).find((p) => p?.name === name)
}

const scoped = (resourceType, readonly = true) => ({
  resourceType,
  criteria: `${resourceType}?_compartment=%organization`,
  ...(readonly ? { readonly: true } : {}),
})

// Directory/shared entries, copied from Front Desk so the shape matches.
const frontDesk = await getPolicy("Folio Front Desk Access Policy")
if (!frontDesk) fail("The Front Desk policy is missing; the tenancy setup has not been run on this project.")
const DIRECTORY_TYPES = new Set(["Practitioner", "PractitionerRole", "Organization", "Bot", "Bundle", "AuditEvent"])
const directoryEntries = (frontDesk.resource ?? []).filter((r) => DIRECTORY_TYPES.has(r.resourceType))

const NEW_POLICIES = {
  "Folio Lab Scientist Access Policy": [
    scoped("Patient"),
    scoped("Encounter"),
    scoped("ServiceRequest"),
    scoped("Specimen"),
    scoped("Observation"),
    scoped("DiagnosticReport"),
    scoped("Appointment"),
  ],
  "Folio Pharmacist Access Policy": [
    scoped("Patient"),
    scoped("Encounter"),
    scoped("MedicationRequest"),
    scoped("MedicationDispense"),
    scoped("AllergyIntolerance"),
    scoped("Condition"),
    scoped("Appointment"),
  ],
  "Folio Billing Access Policy": [
    scoped("Patient"),
    scoped("Encounter"),
    scoped("Claim"),
    scoped("ClaimResponse"),
    scoped("Coverage"),
    scoped("Invoice"),
    scoped("Appointment"),
  ],
}

for (const [name, entries] of Object.entries(NEW_POLICIES)) {
  const existing = await getPolicy(name)
  if (existing) {
    console.log(`✓ "${name}" already exists; unchanged.`)
    continue
  }
  const r = await fetch(`${baseUrl}/fhir/R4/AccessPolicy`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ resourceType: "AccessPolicy", name, resource: [...entries, ...directoryEntries] }),
  })
  if (!r.ok) fail(`Could not create "${name}" (${r.status}): ${await r.text()}`)
  console.log(`✓ "${name}" created (facility-scoped, read-only).`)
}

// Nurse and doctor: make sure every resource the consultation files is readable.
const CLINICAL_READS = {
  "Folio Nurse Access Policy": ["Composition", "Observation", "Encounter", "ServiceRequest", "MedicationRequest", "MedicationDispense", "DiagnosticReport", "AllergyIntolerance", "Condition"],
  "Folio Doctor Access Policy": ["Composition", "Observation", "Encounter", "ServiceRequest", "MedicationRequest", "MedicationDispense", "DiagnosticReport", "AllergyIntolerance", "Condition"],
}
for (const [name, types] of Object.entries(CLINICAL_READS)) {
  const policy = await getPolicy(name)
  if (!policy) {
    console.log(`— "${name}" not found; skipped.`)
    continue
  }
  const have = new Set((policy.resource ?? []).map((r) => r.resourceType))
  const missing = types.filter((t) => !have.has(t))
  if (missing.length === 0) {
    console.log(`✓ "${name}" already reads all clinical types; unchanged.`)
    continue
  }
  const r = await fetch(`${baseUrl}/fhir/R4/AccessPolicy/${policy.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ ...policy, resource: [...(policy.resource ?? []), ...missing.map((t) => scoped(t))] }),
  })
  if (!r.ok) fail(`Could not update "${name}" (${r.status}): ${await r.text()}`)
  console.log(`✓ "${name}": added ${missing.join(", ")}.`)
}

console.log("\nDone. Lab scientists, pharmacists and billing staff can now be provisioned; clinical reads are facility-scoped.")
