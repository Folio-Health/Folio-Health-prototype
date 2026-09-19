/**
 * Test-side Medplum access for the e2e suite.
 *
 * Uses the app's service account (a project admin) to provision disposable
 * staff accounts and patients in a dedicated "E2E Test Facility", stamp them
 * into that facility's compartment the same way the app's server routes do,
 * and remove everything again at the end. Nothing here goes through the app
 * — the app is exercised only through the browser.
 */

import { readFileSync } from "node:fs"
import { randomBytes } from "node:crypto"
import { join } from "node:path"
import { FOLIO_ROLE_SYSTEM, ROLE_ACCESS_POLICY_NAMES } from "../../src/lib/auth/roles"

type Role = keyof typeof ROLE_ACCESS_POLICY_NAMES

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  for (const file of [".env", ".env.local"]) {
    let text: string
    try {
      text = readFileSync(join(process.cwd(), file), "utf8")
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
export const MEDPLUM_BASE = (env.MEDPLUM_BASE_URL ?? "http://localhost:8103/").replace(/\/+$/, "")
export const FACILITY_NAME = "E2E Test Facility"

let cachedToken: string | null = null

async function serviceToken(): Promise<string> {
  if (cachedToken) return cachedToken
  const response = await fetch(`${MEDPLUM_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.MEDPLUM_SERVICE_CLIENT_ID ?? "",
      client_secret: env.MEDPLUM_SERVICE_CLIENT_SECRET ?? "",
    }),
  })
  const body = (await response.json().catch(() => ({}))) as { access_token?: string }
  if (!response.ok || !body.access_token) {
    throw new Error(
      `Could not authenticate the service account against ${MEDPLUM_BASE} — is the SSH tunnel up and MEDPLUM_SERVICE_CLIENT_* set in .env.local?`
    )
  }
  cachedToken = body.access_token
  return cachedToken
}

export async function svc<T = unknown>(path: string, init: RequestInit = {}): Promise<{ status: number; body: T }> {
  const token = await serviceToken()
  const response = await fetch(`${MEDPLUM_BASE}/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  })
  const body = (await response.json().catch(() => ({}))) as T
  return { status: response.status, body }
}

interface Bundle<T> {
  entry?: { resource?: T }[]
}
interface Org {
  id?: string
  name?: string
  active?: boolean
}

export interface Facility {
  id: string
  reference: string
  display: string
}

/** The dedicated test facility, created on first use. */
export async function ensureFacility(): Promise<Facility> {
  const found = await svc<Bundle<Org>>(`fhir/R4/Organization?name=${encodeURIComponent(FACILITY_NAME)}&_count=5`)
  let org = found.body.entry?.map((e) => e.resource).find((o) => o?.name === FACILITY_NAME)
  if (!org?.id) {
    const created = await svc<Org>("fhir/R4/Organization", {
      method: "POST",
      body: JSON.stringify({ resourceType: "Organization", name: FACILITY_NAME, active: true }),
    })
    if (created.status >= 400) throw new Error(`Could not create ${FACILITY_NAME} (${created.status})`)
    org = created.body
  }
  return { id: org.id as string, reference: `Organization/${org.id}`, display: FACILITY_NAME }
}

async function projectId(): Promise<string> {
  const me = await svc<{ project?: { id?: string } }>("auth/me")
  if (!me.body.project?.id) throw new Error("Service account has no project.")
  return me.body.project.id
}

async function policyId(role: Role): Promise<string> {
  const name = ROLE_ACCESS_POLICY_NAMES[role]
  const found = await svc<Bundle<{ id?: string; name?: string }>>(`fhir/R4/AccessPolicy?name=${encodeURIComponent(name)}`)
  const policy = found.body.entry?.map((e) => e.resource).find((p) => p?.name === name)
  if (!policy?.id) {
    throw new Error(`AccessPolicy "${name}" is not installed — run scripts/author-clinical-policies.mjs first.`)
  }
  return policy.id
}

export interface TestUser {
  role: Role
  email: string
  password: string
  practitionerId: string
  name: string
}

/**
 * Provision a facility user exactly as the app's invite does (policy bound
 * to the facility, role identifier stamped), with a known password and no
 * forced first-login change, so the browser can sign straight in.
 */
export async function provisionUser(role: Role, facility: Facility): Promise<TestUser> {
  const stamp = Date.now().toString(36) + randomBytes(2).toString("hex")
  const email = `e2e.${role}.${stamp}@folio.local`
  const password = `E2e-${randomBytes(6).toString("hex")}!9`
  const firstName = "E2E"
  const lastName = role.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  const invite = await svc<{ profile?: { reference?: string } }>(`admin/projects/${await projectId()}/invite`, {
    method: "POST",
    body: JSON.stringify({
      resourceType: "Practitioner",
      firstName,
      lastName,
      email,
      sendEmail: false,
      password,
      membership: {
        access: [
          {
            policy: { reference: `AccessPolicy/${await policyId(role)}` },
            parameter: [{ name: "organization", valueReference: { reference: facility.reference, display: facility.display } }],
          },
        ],
      },
    }),
  })
  const practitionerId = invite.body.profile?.reference?.split("/")[1]
  if (invite.status >= 400 || !practitionerId) throw new Error(`Invite failed for ${role} (${invite.status}): ${JSON.stringify(invite.body)}`)

  const practitioner = await svc<Record<string, unknown> & { identifier?: unknown[] }>(`fhir/R4/Practitioner/${practitionerId}`)
  await svc(`fhir/R4/Practitioner/${practitionerId}`, {
    method: "PUT",
    body: JSON.stringify({
      ...practitioner.body,
      identifier: [...(practitioner.body.identifier ?? []), { system: FOLIO_ROLE_SYSTEM, value: role }],
    }),
  })

  return { role, email, password, practitionerId, name: `${firstName} ${lastName}` }
}

export interface TestPatient {
  id: string
  name: string
  phone: string
}

/** A patient registered at the test facility (stamped into its compartment). */
export async function createPatient(facility: Facility, overrides: { given?: string; family?: string; phone?: string; nin?: string } = {}): Promise<TestPatient> {
  const stamp = Date.now().toString(36)
  const given = overrides.given ?? "Test"
  const family = overrides.family ?? `Patient${stamp}`
  const phone = overrides.phone ?? `080${String(Date.now()).slice(-8)}`
  const created = await svc<{ id?: string }>("fhir/R4/Patient", {
    method: "POST",
    body: JSON.stringify({
      resourceType: "Patient",
      active: true,
      name: [{ given: [given], family }],
      gender: "female",
      birthDate: "1990-05-15",
      telecom: [{ system: "phone", value: phone }],
      ...(overrides.nin ? { identifier: [{ system: "https://folio.health/fhir/sid/nin", value: overrides.nin }] } : {}),
      meta: { account: { reference: facility.reference, display: facility.display } },
    }),
  })
  if (created.status >= 400 || !created.body.id) throw new Error(`Could not create patient (${created.status})`)
  return { id: created.body.id, name: `${given} ${family}`, phone }
}

/** Remove a patient and everything that references them. */
export async function deletePatientGraph(patientId: string): Promise<void> {
  const types = [
    "MedicationDispense",
    "MedicationRequest",
    "DiagnosticReport",
    "Observation",
    "ServiceRequest",
    "Composition",
    "Condition",
    "AllergyIntolerance",
    "Encounter",
    "Appointment",
  ]
  for (const type of types) {
    const param = type === "Appointment" ? "actor" : type === "Composition" || type === "Condition" || type === "Encounter" ? "subject" : "patient"
    const found = await svc<Bundle<{ id?: string }>>(`fhir/R4/${type}?${param}=Patient/${patientId}&_count=200`)
    for (const entry of found.body.entry ?? []) {
      if (entry.resource?.id) await svc(`fhir/R4/${type}/${entry.resource.id}`, { method: "DELETE" })
    }
  }
  await svc(`fhir/R4/Patient/${patientId}`, { method: "DELETE" })
}

/** Deactivate a provisioned user (accounts are never deleted — audit attribution). */
export async function deactivateUser(user: TestUser): Promise<void> {
  const memberships = await svc<Bundle<Record<string, unknown> & { id?: string }>>(
    `fhir/R4/ProjectMembership?profile=Practitioner/${user.practitionerId}`
  )
  for (const entry of memberships.body.entry ?? []) {
    const m = entry.resource
    if (m?.id) await svc(`fhir/R4/ProjectMembership/${m.id}`, { method: "PUT", body: JSON.stringify({ ...m, active: false }) })
  }
  const practitioner = await svc<Record<string, unknown>>(`fhir/R4/Practitioner/${user.practitionerId}`)
  await svc(`fhir/R4/Practitioner/${user.practitionerId}`, {
    method: "PUT",
    body: JSON.stringify({ ...practitioner.body, active: false }),
  })
}

/** Read one resource with the service identity (for assertions on what the UI wrote). */
export async function read<T>(reference: string): Promise<T> {
  const r = await svc<T>(`fhir/R4/${reference}`)
  if (r.status >= 400) throw new Error(`Could not read ${reference} (${r.status})`)
  return r.body
}

export async function search<T>(query: string): Promise<T[]> {
  const r = await svc<Bundle<T>>(`fhir/R4/${query}`)
  return (r.body.entry ?? []).map((e) => e.resource).filter((x): x is T => Boolean(x))
}
