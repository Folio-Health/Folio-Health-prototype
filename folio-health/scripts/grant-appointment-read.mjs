/**
 * Grant facility roles READ access to Appointment, scoped to their facility.
 *
 * The appointments module keeps writes on the server (the /api/appointments
 * routes enforce the booking rules and state machine with the service
 * identity), but every facility role needs to SEE its facility's schedule.
 * This adds `Appointment` with `criteria: "Appointment?_compartment=
 * %organization"` and `readonly: true` to each facility policy that lacks it.
 *
 * Runs as the service account (must be a project admin — see
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

const tokenResponse = await fetch(`${baseUrl}/oauth2/token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.MEDPLUM_SERVICE_CLIENT_ID ?? "",
    client_secret: env.MEDPLUM_SERVICE_CLIENT_SECRET ?? "",
  }),
})
const tokens = await tokenResponse.json().catch(() => ({}))
if (!tokenResponse.ok || !tokens.access_token) fail("Could not authenticate the service account.")
const auth = { Authorization: `Bearer ${tokens.access_token}` }

const POLICIES = [
  "Folio Front Desk Access Policy",
  "Folio Doctor Access Policy",
  "Folio Nurse Access Policy",
  "Folio Facility Admin Access Policy",
  "Folio HIM Access Policy",
  "Folio Facility Access Policy",
]

const ENTRY = {
  resourceType: "Appointment",
  criteria: "Appointment?_compartment=%organization",
  readonly: true,
}

for (const name of POLICIES) {
  const search = await fetch(`${baseUrl}/fhir/R4/AccessPolicy?name=${encodeURIComponent(name)}`, {
    headers: auth,
  })
  const bundle = await search.json().catch(() => ({}))
  if (!search.ok) fail(`Could not read "${name}" (${search.status}). Is the service account admin?`)
  const policy = bundle.entry?.map((e) => e.resource).find((p) => p?.name === name)
  if (!policy) {
    console.log(`— "${name}" not found on this project; skipped.`)
    continue
  }
  if ((policy.resource ?? []).some((r) => r.resourceType === "Appointment")) {
    console.log(`✓ "${name}" already grants Appointment; unchanged.`)
    continue
  }
  const put = await fetch(`${baseUrl}/fhir/R4/AccessPolicy/${policy.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ ...policy, resource: [...(policy.resource ?? []), ENTRY] }),
  })
  if (!put.ok) fail(`Could not update "${name}" (${put.status}): ${await put.text()}`)
  console.log(`✓ "${name}": Appointment read (facility-scoped) granted.`)
}

console.log("\nDone. Facility roles can now see their facility's appointments; writes stay on the server routes.")
