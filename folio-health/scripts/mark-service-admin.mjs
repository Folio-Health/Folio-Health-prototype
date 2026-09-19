/**
 * One-off: mark the Folio service account's ProjectMembership as admin.
 *
 * Medplum reserves account provisioning (invite, ProjectMembership and
 * AccessPolicy access) for PROJECT admins. The app performs those calls with
 * its service identity ("Folio Credential Service") after its own
 * authorisation checks — but that only works once the service account's
 * membership carries `admin: true`. Editing a membership is itself a
 * project-admin operation, so this script signs in as the PLATFORM OPERATOR
 * (who is a project admin) and flips the flag once.
 *
 * Usage (PowerShell):
 *   $env:FOLIO_OPERATOR_EMAIL = "operator@example.com"
 *   $env:FOLIO_OPERATOR_PASSWORD = "..."
 *   node scripts/mark-service-admin.mjs
 *
 * Reads MEDPLUM_BASE_URL, MEDPLUM_CLIENT_ID and MEDPLUM_SERVICE_CLIENT_ID
 * from .env.local. Idempotent: safe to run again; reports if already admin.
 */

import { createHash, randomBytes } from "node:crypto"
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
const clientId = env.MEDPLUM_CLIENT_ID
const serviceClientId = env.MEDPLUM_SERVICE_CLIENT_ID
const email = process.env.FOLIO_OPERATOR_EMAIL
const password = process.env.FOLIO_OPERATOR_PASSWORD

function fail(message) {
  console.error(`\n✗ ${message}`)
  process.exit(1)
}

if (!clientId) fail("MEDPLUM_CLIENT_ID is not set in .env.local")
if (!serviceClientId) fail("MEDPLUM_SERVICE_CLIENT_ID is not set in .env.local")
if (!email || !password) {
  fail(
    "Set FOLIO_OPERATOR_EMAIL and FOLIO_OPERATOR_PASSWORD to the platform operator's " +
      "sign-in (the operator is a Medplum project admin, which this change requires)."
  )
}

const base64url = (buffer) => buffer.toString("base64url")

async function post(path, body, headers = {}) {
  const response = await fetch(`${baseUrl}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  })
  return { ok: response.ok, status: response.status, body: await response.json().catch(() => ({})) }
}

// ── 1. Sign in as the operator (same PKCE flow the app itself uses) ─────────
const codeVerifier = base64url(randomBytes(32))
const codeChallenge = base64url(createHash("sha256").update(codeVerifier).digest())

const login = await post("auth/login", {
  clientId,
  email,
  password,
  scope: "openid offline_access",
  codeChallenge,
  codeChallengeMethod: "S256",
})
if (!login.ok) {
  fail(`Sign-in rejected (${login.status}): ${login.body?.issue?.[0]?.details?.text ?? "check the email/password"}`)
}

let code = login.body.code
if (!code && login.body.login && login.body.memberships?.length) {
  const profile = await post("auth/profile", {
    login: login.body.login,
    profile: login.body.memberships[0].id,
  })
  if (!profile.ok || !profile.body.code) fail("Could not select a project profile for the operator.")
  code = profile.body.code
}
if (!code) fail("Sign-in did not return an authorization code.")

const tokenResponse = await fetch(`${baseUrl}/oauth2/token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    code_verifier: codeVerifier,
  }),
})
const tokens = await tokenResponse.json().catch(() => ({}))
if (!tokenResponse.ok || !tokens.access_token) fail("Could not exchange the sign-in for a token.")
const auth = { Authorization: `Bearer ${tokens.access_token}` }
console.log(`✓ Signed in as ${email}`)

async function get(path) {
  const response = await fetch(`${baseUrl}/${path}`, { headers: auth })
  return { ok: response.ok, status: response.status, body: await response.json().catch(() => ({})) }
}

// ── 2. Confirm the operator really is a project admin ───────────────────────
const me = await get("auth/me")
if (!me.ok) fail(`auth/me failed (${me.status}).`)
if (!me.body?.membership?.admin) {
  fail(
    `${email} is not a project admin on this Medplum project — use the platform operator account.`
  )
}

// ── 3. Find the service client's membership and set admin ───────────────────
const search = await get(
  `fhir/R4/ProjectMembership?profile=ClientApplication/${encodeURIComponent(serviceClientId)}`
)
if (!search.ok) fail(`Could not search memberships (${search.status}).`)
const membership = search.body?.entry?.[0]?.resource
if (!membership?.id) {
  fail(
    `No ProjectMembership found for ClientApplication/${serviceClientId} — is ` +
      "MEDPLUM_SERVICE_CLIENT_ID correct?"
  )
}

if (membership.admin === true) {
  console.log(`✓ Already admin: nothing to do (ProjectMembership/${membership.id}).`)
  process.exit(0)
}

const putResponse = await fetch(`${baseUrl}/fhir/R4/ProjectMembership/${membership.id}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json", ...auth },
  body: JSON.stringify({ ...membership, admin: true }),
})
if (!putResponse.ok) {
  fail(`Could not update the membership (${putResponse.status}): ${await putResponse.text()}`)
}

// ── 4. Verify ────────────────────────────────────────────────────────────────
const verify = await get(`fhir/R4/ProjectMembership/${membership.id}`)
if (verify.ok && verify.body?.admin === true) {
  console.log(
    `✓ Done: "Folio Credential Service" (ProjectMembership/${membership.id}) is now a ` +
      "project admin. Hospital admins can now create staff accounts."
  )
} else {
  fail("The update did not stick — re-check in Medplum.")
}
