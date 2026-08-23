/**
 * One-off: make the Front Desk AccessPolicy read-only on Patient.
 *
 * Reception registers patients and views demographics, but post-registration
 * corrections belong to Medical Records (EMR V1 RBAC spec §7.5/§7.6). Since
 * registration goes through /api/patients (the service identity stamps the
 * facility), the front desk needs NO direct Patient write access at all —
 * so the server policy can say so, making the hidden Edit button a real
 * boundary instead of a cosmetic one.
 *
 * Runs as the service account (must already be a project admin — see
 * mark-service-admin.mjs). Idempotent.
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

if (!env.MEDPLUM_SERVICE_CLIENT_ID || !env.MEDPLUM_SERVICE_CLIENT_SECRET) {
  fail("MEDPLUM_SERVICE_CLIENT_ID / MEDPLUM_SERVICE_CLIENT_SECRET are not set in .env.local")
}

const tokenResponse = await fetch(`${baseUrl}/oauth2/token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.MEDPLUM_SERVICE_CLIENT_ID,
    client_secret: env.MEDPLUM_SERVICE_CLIENT_SECRET,
  }),
})
const tokens = await tokenResponse.json().catch(() => ({}))
if (!tokenResponse.ok || !tokens.access_token) fail("Could not authenticate the service account.")
const auth = { Authorization: `Bearer ${tokens.access_token}` }

const POLICY_NAME = "Folio Front Desk Access Policy"
const searchResponse = await fetch(
  `${baseUrl}/fhir/R4/AccessPolicy?name=${encodeURIComponent(POLICY_NAME)}`,
  { headers: auth }
)
const bundle = await searchResponse.json().catch(() => ({}))
if (!searchResponse.ok) {
  fail(
    `Could not read the policy (${searchResponse.status}). Is the service account a project ` +
      "admin yet? Run scripts/mark-service-admin.mjs first."
  )
}
const policy = bundle.entry?.map((e) => e.resource).find((p) => p?.name === POLICY_NAME)
if (!policy) fail(`AccessPolicy "${POLICY_NAME}" not found on this project.`)

const patientEntries = (policy.resource ?? []).filter((r) => r.resourceType === "Patient")
if (patientEntries.length === 0) fail("The policy has no Patient entry — nothing to harden.")
if (patientEntries.every((r) => r.readonly === true)) {
  console.log("✓ Already hardened: Patient is read-only for the front desk. Nothing to do.")
  process.exit(0)
}

const updated = {
  ...policy,
  resource: policy.resource.map((r) =>
    r.resourceType === "Patient" ? { ...r, readonly: true } : r
  ),
}
const putResponse = await fetch(`${baseUrl}/fhir/R4/AccessPolicy/${policy.id}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json", ...auth },
  body: JSON.stringify(updated),
})
if (!putResponse.ok) fail(`Could not update the policy (${putResponse.status}): ${await putResponse.text()}`)

console.log(
  `✓ Done: "${POLICY_NAME}" now marks Patient read-only. The front desk can register ` +
    "(via the app's service-backed route) and view, but can no longer edit patient records."
)
