/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only"

import { faker } from "@faker-js/faker"
import {
  FOLIO_ROLE_SYSTEM,
  ROLE_ACCESS_POLICY_NAMES,
  TEMP_CREDENTIAL_EXTENSION_URL,
} from "@/lib/auth/roles"
import { ORGANIZATION_TYPE_SYSTEM } from "@/lib/fhir/organization-types"

/** The three seeded sign-in personas; any provisioned account can sign in too. */
type DemoPersona = "operator" | "facility-admin" | "doctor"

/**
 * In-memory FHIR store for demo mode (`FOLIO_DEMO_MODE=1`).
 *
 * `demoMedplumRequest` speaks just enough of Medplum's HTTP surface —
 * `auth/me`, `fhir/R4/*` search/read/create/update, and the project invite —
 * that the real route handlers and the admin plane run against it unchanged.
 * The search engine implements ONLY the parameters this app actually sends
 * (see the hooks in src/features/*): an unknown parameter is ignored rather
 * than erroring, which is lenient in exactly the way a demo should be.
 *
 * Data is seeded deterministically (fixed faker seed) so every teammate sees
 * the same hospital. Writes work — registered facilities, invited staff and
 * edited patients persist — but only until the dev server restarts. That is a
 * feature: a demo you can never mess up permanently.
 */

type AnyResource = {
  resourceType: string
  id: string
  meta?: { lastUpdated?: string; [key: string]: any }
  [key: string]: any
}

export interface DemoResponse {
  status: number
  body: unknown
}

const DEMO_PROJECT_ID = "demo-project"
const DEMO_PROJECT_NAME = "Folio Health (Demo)"

const PERSONA_PRACTITIONER_IDS: Record<DemoPersona, string> = {
  operator: "prac-demo-operator",
  "facility-admin": "prac-demo-admin",
  doctor: "prac-demo-doctor",
}

// ── Store ────────────────────────────────────────────────────────────────────

interface DemoStore {
  resources: Map<string, Map<string, AnyResource>>
}

/** Survives Turbopack HMR module reloads, resets on server restart. */
function getStore(): DemoStore {
  const g = globalThis as { __folioDemoStore?: DemoStore }
  if (!g.__folioDemoStore) g.__folioDemoStore = seedStore()
  return g.__folioDemoStore
}

function collection(type: string): Map<string, AnyResource> {
  const store = getStore()
  let map = store.resources.get(type)
  if (!map) {
    map = new Map()
    store.resources.set(type, map)
  }
  return map
}

function put(resource: AnyResource): AnyResource {
  collection(resource.resourceType).set(resource.id, resource)
  return resource
}

// ── Seeding ──────────────────────────────────────────────────────────────────

function iso(date: Date): string {
  return date.toISOString()
}

function daysFromNow(days: number, hours = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hours || d.getHours(), faker.number.int({ min: 0, max: 59 }), 0, 0)
  return d
}

const FACILITY_SEEDS = [
  { id: "org-demo-1", name: "Sunrise Medical Centre", city: "Lagos", active: true, registeredDaysAgo: 150 },
  { id: "org-demo-2", name: "Riverside General Hospital", city: "Abuja", active: true, registeredDaysAgo: 120 },
  { id: "org-demo-3", name: "St. Mary's Specialist Clinic", city: "Ibadan", active: true, registeredDaysAgo: 70 },
  { id: "org-demo-4", name: "Greenfield Maternity Home", city: "Enugu", active: true, registeredDaysAgo: 30 },
  { id: "org-demo-5", name: "Lakeside Diagnostics", city: "Port Harcourt", active: true, registeredDaysAgo: 9 },
  { id: "org-demo-6", name: "Unity Community Hospital", city: "Kano", active: false, registeredDaysAgo: 200 },
]

const ALLERGY_NAMES = ["Penicillin", "Peanuts", "Latex", "Sulfa drugs", "Aspirin", "Shellfish"]
const CONDITION_NAMES = [
  "Hypertension",
  "Type 2 diabetes",
  "Asthma",
  "Malaria",
  "Peptic ulcer disease",
  "Osteoarthritis",
  "Anaemia",
]
const LAB_TESTS = [
  "Full blood count",
  "Malaria parasite test",
  "Fasting blood glucose",
  "Lipid profile",
  "Urinalysis",
  "Liver function test",
]
const AUDIT_ACTIONS = [
  "Read patient record",
  "Updated patient record",
  "Searched patients",
  "Created appointment",
  "Signed in",
  "Read facility",
]

function humanName(first: string, last: string) {
  return [{ given: [first], family: last, text: `${first} ${last}` }]
}

function seedPractitioner(options: {
  id: string
  first: string
  last: string
  email: string
  role: string | null
  facility: { id: string; name: string } | null
  active?: boolean
  lastUpdatedDaysAgo?: number
}): AnyResource {
  return put({
    resourceType: "Practitioner",
    id: options.id,
    active: options.active !== false,
    name: humanName(options.first, options.last),
    telecom: [
      { system: "email", value: options.email },
      { system: "phone", value: faker.phone.number({ style: "international" }) },
    ],
    ...(options.role
      ? { identifier: [{ system: FOLIO_ROLE_SYSTEM, value: options.role }] }
      : {}),
    ...(options.facility
      ? {
          meta: {
            lastUpdated: iso(daysFromNow(-(options.lastUpdatedDaysAgo ?? 60))),
            account: {
              reference: `Organization/${options.facility.id}`,
              display: options.facility.name,
            },
          },
        }
      : { meta: { lastUpdated: iso(daysFromNow(-(options.lastUpdatedDaysAgo ?? 60))) } }),
  })
}

function seedMembership(practitioner: AnyResource, options: { admin?: boolean; facility?: { id: string; name: string }; active?: boolean }) {
  return put({
    resourceType: "ProjectMembership",
    id: `pm-${practitioner.id}`,
    active: options.active !== false,
    admin: options.admin === true,
    profile: {
      reference: `Practitioner/${practitioner.id}`,
      display: practitioner.name?.[0]?.text,
    },
    ...(options.facility
      ? {
          access: [
            {
              parameter: [
                {
                  name: "organization",
                  valueReference: {
                    reference: `Organization/${options.facility.id}`,
                    display: options.facility.name,
                  },
                },
              ],
            },
          ],
        }
      : {}),
    meta: { lastUpdated: iso(daysFromNow(-30)) },
  })
}

function seedStore(): DemoStore {
  const g = globalThis as { __folioDemoStore?: DemoStore }
  g.__folioDemoStore = { resources: new Map() }

  // Fixed seed: every teammate's demo hospital holds the same people.
  faker.seed(20260809)

  // Facilities.
  for (const seed of FACILITY_SEEDS) {
    put({
      resourceType: "Organization",
      id: seed.id,
      active: seed.active,
      name: seed.name,
      identifier: [
        { system: "https://folio.health/fhir/sid/facility", value: `FAC-${faker.string.numeric(5)}` },
      ],
      type: [
        {
          coding: [
            { system: ORGANIZATION_TYPE_SYSTEM, code: "prov", display: "Healthcare Provider" },
          ],
          text: "Healthcare Provider",
        },
      ],
      telecom: [
        { system: "phone", value: faker.phone.number({ style: "international" }) },
        { system: "email", value: `info@${seed.id.replace(/-/g, "")}.example` },
      ],
      address: [{ text: `${faker.location.streetAddress()}, ${seed.city}`, city: seed.city }],
      meta: { lastUpdated: iso(daysFromNow(-seed.registeredDaysAgo)) },
    })
  }

  const activeFacilities = FACILITY_SEEDS.filter((f) => f.active)
  const homeFacility = FACILITY_SEEDS[0]

  // The three sign-in personas (see lib/demo/mode.ts).
  const operator = seedPractitioner({
    id: PERSONA_PRACTITIONER_IDS.operator,
    first: "Demo",
    last: "Operator",
    email: "operator@demo.folio",
    role: null,
    facility: null,
  })
  seedMembership(operator, { admin: true })

  const facilityAdmin = seedPractitioner({
    id: PERSONA_PRACTITIONER_IDS["facility-admin"],
    first: "Demo",
    last: "Administrator",
    email: "admin@demo.folio",
    role: "facility-admin",
    facility: homeFacility,
  })
  seedMembership(facilityAdmin, { facility: homeFacility })

  const doctor = seedPractitioner({
    id: PERSONA_PRACTITIONER_IDS.doctor,
    first: "Demo",
    last: "Doctor",
    email: "doctor@demo.folio",
    role: "doctor",
    facility: homeFacility,
  })
  seedMembership(doctor, { facility: homeFacility })

  // Staff spread across the facilities.
  const staffRoles = ["doctor", "nurse", "front-desk", "him-officer"]
  let staffIndex = 0
  for (const facility of FACILITY_SEEDS) {
    for (const role of staffRoles.slice(0, facility.active ? 4 : 2)) {
      staffIndex += 1
      const first = faker.person.firstName()
      const last = faker.person.lastName()
      const practitioner = seedPractitioner({
        id: `prac-demo-${staffIndex}`,
        first,
        last,
        email: faker.internet.email({ firstName: first, lastName: last }).toLowerCase(),
        role,
        facility,
        // A couple of explicitly disabled accounts so status breakdowns and
        // the staff table have something real to show.
        active: staffIndex % 9 !== 0,
        lastUpdatedDaysAgo: faker.number.int({ min: 5, max: 140 }),
      })
      seedMembership(practitioner, { facility, active: staffIndex % 9 !== 0 })
    }
  }

  // Installed access policies, looked up by name at invite time.
  let policyIndex = 0
  for (const name of Object.values(ROLE_ACCESS_POLICY_NAMES)) {
    policyIndex += 1
    put({
      resourceType: "AccessPolicy",
      id: `ap-demo-${policyIndex}`,
      name,
      meta: { lastUpdated: iso(daysFromNow(-180)) },
    })
  }

  // Patients.
  const patients: AnyResource[] = []
  for (let i = 1; i <= 48; i++) {
    const gender = faker.helpers.arrayElement(["male", "female"] as const)
    const first = faker.person.firstName(gender)
    const last = faker.person.lastName()
    const facility = faker.helpers.arrayElement(activeFacilities)
    const patient = put({
      resourceType: "Patient",
      id: `pat-demo-${i}`,
      active: i % 11 !== 0,
      gender,
      name: humanName(first, last),
      birthDate: iso(faker.date.birthdate({ mode: "age", min: 1, max: 88 })).slice(0, 10),
      telecom: [
        { system: "phone", value: faker.phone.number({ style: "international" }) },
        { system: "email", value: faker.internet.email({ firstName: first, lastName: last }).toLowerCase() },
      ],
      address: [{ text: `${faker.location.streetAddress()}, ${facility.city}`, city: facility.city }],
      identifier: [
        {
          type: { coding: [{ code: "MR", display: "Medical record number" }] },
          value: `MRN-${faker.string.numeric(6)}`,
        },
      ],
      managingOrganization: { reference: `Organization/${facility.id}`, display: facility.name },
      meta: { lastUpdated: iso(daysFromNow(-faker.number.int({ min: 0, max: 90 }))) },
    })
    patients.push(patient)
  }

  // Clinical resources hanging off each patient.
  let clinicalId = 0
  for (const patient of patients) {
    const patientRef = { reference: `Patient/${patient.id}`, display: patient.name?.[0]?.text }

    for (const allergy of faker.helpers.arrayElements(ALLERGY_NAMES, { min: 0, max: 2 })) {
      clinicalId += 1
      put({
        resourceType: "AllergyIntolerance",
        id: `alg-demo-${clinicalId}`,
        clinicalStatus: { coding: [{ code: "active" }], text: "Active" },
        code: { text: allergy },
        criticality: faker.helpers.arrayElement(["low", "high"]),
        patient: patientRef,
        recordedDate: iso(faker.date.recent({ days: 400 })),
        meta: { lastUpdated: iso(daysFromNow(-faker.number.int({ min: 1, max: 200 }))) },
      })
    }

    for (const condition of faker.helpers.arrayElements(CONDITION_NAMES, { min: 0, max: 3 })) {
      clinicalId += 1
      put({
        resourceType: "Condition",
        id: `cond-demo-${clinicalId}`,
        clinicalStatus: { coding: [{ code: "active" }], text: "Active" },
        code: { text: condition },
        subject: patientRef,
        onsetDateTime: iso(faker.date.recent({ days: 700 })),
        meta: { lastUpdated: iso(daysFromNow(-faker.number.int({ min: 1, max: 200 }))) },
      })
    }
  }

  // Vital-sign observations for the first stretch of patients.
  const vitals = [
    { text: "Heart rate", unit: "bpm", min: 58, max: 110 },
    { text: "Body temperature", unit: "°C", min: 36, max: 39 },
    { text: "Systolic blood pressure", unit: "mmHg", min: 100, max: 165 },
    { text: "Diastolic blood pressure", unit: "mmHg", min: 60, max: 100 },
    { text: "Oxygen saturation", unit: "%", min: 91, max: 100 },
    { text: "Respiratory rate", unit: "breaths/min", min: 12, max: 24 },
  ]
  let obsId = 0
  for (const patient of patients.slice(0, 24)) {
    for (let reading = 0; reading < 4; reading++) {
      const effective = daysFromNow(-(reading * 7 + faker.number.int({ min: 0, max: 3 })))
      for (const vital of vitals) {
        obsId += 1
        put({
          resourceType: "Observation",
          id: `obs-demo-${obsId}`,
          status: "final",
          category: [{ coding: [{ code: "vital-signs" }], text: "Vital signs" }],
          code: { text: vital.text },
          subject: { reference: `Patient/${patient.id}`, display: patient.name?.[0]?.text },
          effectiveDateTime: iso(effective),
          valueQuantity: {
            value: faker.number.int({ min: vital.min, max: vital.max }),
            unit: vital.unit,
          },
          meta: { lastUpdated: iso(effective) },
        })
      }
    }
  }

  // Appointments: a past week, a busy today, and a booked fortnight ahead.
  let apptId = 0
  for (let day = -7; day <= 14; day++) {
    const perDay = day === 0 ? 8 : faker.number.int({ min: 2, max: 6 })
    for (let n = 0; n < perDay; n++) {
      apptId += 1
      const patient = faker.helpers.arrayElement(patients)
      const start = daysFromNow(day, faker.number.int({ min: 8, max: 16 }))
      const end = new Date(start.getTime() + 30 * 60 * 1000)
      put({
        resourceType: "Appointment",
        id: `appt-demo-${apptId}`,
        status: day < 0 ? "fulfilled" : "booked",
        description: faker.helpers.arrayElement([
          "General consultation",
          "Follow-up visit",
          "Antenatal check",
          "Lab result review",
          "Vaccination",
        ]),
        serviceType: [{ text: "Outpatient" }],
        start: iso(start),
        end: iso(end),
        participant: [
          {
            actor: { reference: `Patient/${patient.id}`, display: patient.name?.[0]?.text },
            status: "accepted",
          },
        ],
        meta: { lastUpdated: iso(start) },
      })
    }
  }

  // Encounters — a handful currently in progress so the dashboard has a number.
  for (let i = 1; i <= 10; i++) {
    const patient = faker.helpers.arrayElement(patients)
    put({
      resourceType: "Encounter",
      id: `enc-demo-${i}`,
      status: i <= 6 ? "in-progress" : "finished",
      class: { code: "AMB", display: "Ambulatory" },
      subject: { reference: `Patient/${patient.id}`, display: patient.name?.[0]?.text },
      period: { start: iso(daysFromNow(0, faker.number.int({ min: 7, max: 11 }))) },
      meta: { lastUpdated: iso(daysFromNow(0)) },
    })
  }

  // Active lab orders.
  for (let i = 1; i <= 14; i++) {
    const patient = faker.helpers.arrayElement(patients)
    put({
      resourceType: "ServiceRequest",
      id: `sr-demo-${i}`,
      status: i <= 10 ? "active" : "completed",
      intent: "order",
      code: { text: faker.helpers.arrayElement(LAB_TESTS) },
      subject: { reference: `Patient/${patient.id}`, display: patient.name?.[0]?.text },
      authoredOn: iso(faker.date.recent({ days: 6 })),
      meta: { lastUpdated: iso(faker.date.recent({ days: 6 })) },
    })
  }

  // A recent audit trail.
  const staffNames = ["Demo Administrator", "Demo Doctor", "Demo Operator"]
  for (let i = 1; i <= 24; i++) {
    const recorded = faker.date.recent({ days: 3 })
    put({
      resourceType: "AuditEvent",
      id: `audit-demo-${i}`,
      type: { code: "rest", display: faker.helpers.arrayElement(AUDIT_ACTIONS) },
      recorded: iso(recorded),
      outcome: "0",
      agent: [{ who: { display: faker.helpers.arrayElement(staffNames) }, requestor: true }],
      meta: { lastUpdated: iso(recorded) },
    })
  }

  return g.__folioDemoStore
}

// ── Search engine ────────────────────────────────────────────────────────────

/** Text a `name` search parameter matches against, per resource type. */
function nameText(resource: AnyResource): string {
  if (typeof resource.name === "string") return resource.name
  const name = resource.name?.[0]
  if (!name) return ""
  return name.text ?? [...(name.given ?? []), name.family].filter(Boolean).join(" ")
}

/** The value a `date` search parameter compares against, per resource type. */
function dateValue(resource: AnyResource): string | undefined {
  return (
    resource.start ??
    resource.effectiveDateTime ??
    resource.recorded ??
    resource.authoredOn ??
    resource.period?.start ??
    resource.meta?.lastUpdated
  )
}

/** References that tie a resource to a patient, whatever field carries them. */
function patientRefs(resource: AnyResource): string[] {
  return [
    resource.patient?.reference,
    resource.subject?.reference,
    ...((resource.participant ?? []).map((p: any) => p?.actor?.reference) as string[]),
  ].filter(Boolean)
}

/** FHIR date comparison with a ge/le/gt/lt/eq prefix. Lenient on parse failure. */
function matchesDateParam(value: string | undefined, param: string): boolean {
  const match = /^(ge|le|gt|lt|eq)?(.*)$/.exec(param)
  const prefix = match?.[1] ?? "eq"
  const target = Date.parse(match?.[2] ?? "")
  const actual = Date.parse(value ?? "")
  if (Number.isNaN(target) || Number.isNaN(actual)) return false
  switch (prefix) {
    case "ge":
      return actual >= target
    case "le":
      return actual <= target
    case "gt":
      return actual > target
    case "lt":
      return actual < target
    default:
      // eq at day granularity — close enough for the demo.
      return Math.abs(actual - target) < 24 * 60 * 60 * 1000
  }
}

function searchBundle(type: string, params: URLSearchParams): unknown {
  let items = [...collection(type).values()]

  for (const key of new Set(params.keys())) {
    const values = params.getAll(key)
    const value = values[0]
    switch (key) {
      case "_count":
      case "_sort":
      case "_total":
      case "_summary":
        break
      case "_id": {
        const ids = new Set(value.split(","))
        items = items.filter((r) => ids.has(r.id))
        break
      }
      case "name":
      case "name:contains":
        items = items.filter((r) => nameText(r).toLowerCase().includes(value.toLowerCase()))
        break
      case "name:exact":
        items = items.filter((r) => nameText(r) === value)
        break
      case "gender":
        items = items.filter((r) => r.gender === value)
        break
      case "active":
        items = items.filter((r) => r.active === (value === "true"))
        break
      case "status":
        items = items.filter((r) => r.status === value)
        break
      case "category":
        items = items.filter((r) =>
          (r.category ?? []).some((c: any) => (c.coding ?? []).some((coding: any) => coding.code === value))
        )
        break
      case "patient":
      case "subject":
        items = items.filter((r) => patientRefs(r).includes(value))
        break
      case "organization":
        items = items.filter((r) => r.managingOrganization?.reference === value)
        break
      case "date":
        items = items.filter((r) => values.every((v) => matchesDateParam(dateValue(r), v)))
        break
      case "_lastUpdated":
        items = items.filter((r) => values.every((v) => matchesDateParam(r.meta?.lastUpdated, v)))
        break
      default:
        // Parameters this demo does not model (e.g. `_include`) filter nothing.
        break
    }
  }

  const total = items.length

  const sort = params.get("_sort")
  if (sort === "name") {
    items.sort((a, b) => nameText(a).localeCompare(nameText(b)))
  } else if (sort === "date" || sort === "-date") {
    const dir = sort === "date" ? 1 : -1
    items.sort((a, b) => dir * (Date.parse(dateValue(a) ?? "") - Date.parse(dateValue(b) ?? "")))
  } else if (sort === "-_lastUpdated") {
    items.sort(
      (a, b) => Date.parse(b.meta?.lastUpdated ?? "") - Date.parse(a.meta?.lastUpdated ?? "")
    )
  }

  const count = params.get("_summary") === "count" ? 0 : Math.min(Number(params.get("_count") ?? 20), 1000)
  const page = items.slice(0, Number.isNaN(count) ? 20 : count)

  return {
    resourceType: "Bundle",
    type: "searchset",
    total,
    entry: page.map((resource) => ({ resource })),
  }
}

// ── Request handler ──────────────────────────────────────────────────────────

function notFound(message: string): DemoResponse {
  return {
    status: 404,
    body: {
      resourceType: "OperationOutcome",
      issue: [{ severity: "error", code: "not-found", details: { text: message } }],
    },
  }
}

// ── Sessions ─────────────────────────────────────────────────────────────────

/**
 * Teammate convenience, kept from the original three-persona design: an email
 * with no matching account still signs in as one of the seeded personas by
 * substring ("operator"/"platform" → operator, "doctor" → doctor, anything
 * else → facility admin). A provisioned account ALWAYS wins over this fallback.
 */
function fallbackPersonaForEmail(email: string): DemoPersona {
  const normalized = email.toLowerCase()
  if (normalized.includes("operator") || normalized.includes("platform")) return "operator"
  if (normalized.includes("doctor")) return "doctor"
  return "facility-admin"
}

function practitionerEmail(practitioner: AnyResource | undefined): string | null {
  return practitioner?.telecom?.find((t: any) => t.system === "email")?.value ?? null
}

function membershipFor(practitionerId: string): AnyResource | undefined {
  for (const membership of collection("ProjectMembership").values()) {
    if (membership.profile?.reference === `Practitioner/${practitionerId}`) return membership
  }
  return undefined
}

/** The facility a membership is bound to (its %organization parameter). */
function membershipFacility(membership: AnyResource | undefined) {
  const params = (membership?.access ?? []).flatMap((a: any) => a.parameter ?? [])
  return params.find((p: any) => p?.name === "organization")?.valueReference ?? null
}

function hasTempCredential(practitioner: AnyResource | undefined): boolean {
  return (practitioner?.extension ?? []).some(
    (e: any) => e.url === TEMP_CREDENTIAL_EXTENSION_URL && e.valueBoolean === true
  )
}

export type DemoSignIn =
  | { status: "ok"; practitionerId: string; mustChangePassword: boolean }
  | { status: "disabled" }

/**
 * Resolve a sign-in email to a demo account. Mirrors what Medplum enforces in
 * production: a deactivated account (or one whose facility was deactivated,
 * which flips its membership inactive) cannot sign in. The password is never
 * checked — this is demo mode.
 */
export function demoSignIn(email: string): DemoSignIn {
  const wanted = email.trim().toLowerCase()
  let practitioner: AnyResource | undefined
  for (const candidate of collection("Practitioner").values()) {
    if (practitionerEmail(candidate)?.toLowerCase() === wanted) {
      practitioner = candidate
      break
    }
  }
  if (!practitioner) {
    practitioner = collection("Practitioner").get(
      PERSONA_PRACTITIONER_IDS[fallbackPersonaForEmail(wanted)]
    )
  }
  if (!practitioner) return { status: "disabled" }

  const membership = membershipFor(practitioner.id)
  if (practitioner.active === false || membership?.active === false) return { status: "disabled" }

  return {
    status: "ok",
    practitionerId: practitioner.id,
    mustChangePassword: hasTempCredential(practitioner),
  }
}

/** Raw Medplum-shaped `auth/me` payload for a demo session. */
export function demoAuthMe(practitionerId: string): unknown {
  const profile = collection("Practitioner").get(practitionerId)
  const membership = membershipFor(practitionerId)
  return {
    project: { id: DEMO_PROJECT_ID, name: DEMO_PROJECT_NAME },
    membership: membership
      ? { id: membership.id, admin: membership.admin === true, access: membership.access ?? [] }
      : { id: `pm-${practitionerId}`, admin: false },
    profile,
  }
}

/**
 * The `/api/auth/me` response shape for a demo session, derived from the
 * stored Practitioner + ProjectMembership exactly the way the production route
 * derives it from Medplum: role from the role identifier, facility from the
 * membership binding (Practitioner `meta.account` as fallback), first-login
 * flag from the temp-credential extension.
 */
export function demoCurrentUser(practitionerId: string): unknown {
  const profile = collection("Practitioner").get(practitionerId)
  const membership = membershipFor(practitionerId)
  const facility = membershipFacility(membership) ?? profile?.meta?.account ?? null
  const roleTags: string[] = (profile?.identifier ?? [])
    .filter((i: any) => i.system === FOLIO_ROLE_SYSTEM)
    .map((i: any) => i.value)
    .filter(Boolean)
  return {
    id: profile?.id ?? null,
    resourceType: "Practitioner",
    name: profile ? nameText(profile) : "Demo user",
    email: practitionerEmail(profile),
    admin: membership?.admin === true,
    project: DEMO_PROJECT_NAME,
    facilityId: facility?.reference?.split("/")[1] ?? null,
    facilityName: facility?.display ?? null,
    roleTags,
    mustChangePassword: hasTempCredential(profile),
  }
}

/** Demo counterpart of `clearTempCredentialFlag`: the first login is done. */
export function demoClearTempCredential(practitionerId: string): void {
  const practitioner = collection("Practitioner").get(practitionerId)
  if (!practitioner) return
  put({
    ...practitioner,
    extension: (practitioner.extension ?? []).filter(
      (e: any) => e.url !== TEMP_CREDENTIAL_EXTENSION_URL
    ),
    meta: { ...practitioner.meta, lastUpdated: iso(new Date()) },
  })
}

function handleInvite(body: any): DemoResponse {
  const firstName = String(body?.firstName ?? "").trim()
  const lastName = String(body?.lastName ?? "").trim()
  const email = String(body?.email ?? "").trim()
  if (!firstName || !lastName || !email) {
    return { status: 400, body: { error: "firstName, lastName and email are required." } }
  }

  const id = `prac-demo-${crypto.randomUUID().slice(0, 8)}`
  const practitioner = put({
    resourceType: "Practitioner",
    id,
    active: true,
    name: humanName(firstName, lastName),
    telecom: [{ system: "email", value: email }],
    meta: { lastUpdated: iso(new Date()) },
  })
  const membership = put({
    resourceType: "ProjectMembership",
    id: `pm-${id}`,
    active: true,
    admin: false,
    profile: { reference: `Practitioner/${id}`, display: nameText(practitioner) },
    access: body?.membership?.access ?? [],
    meta: { lastUpdated: iso(new Date()) },
  })

  return {
    status: 200,
    body: {
      id: membership.id,
      profile: { reference: `Practitioner/${id}`, display: nameText(practitioner) },
    },
  }
}

/**
 * Serve one Medplum-shaped request from the demo store.
 *
 * @param pathAndQuery Medplum path relative to the base URL, query included —
 *   e.g. `fhir/R4/Patient?gender=female` or `auth/me`.
 */
export function demoMedplumRequest(
  method: string,
  pathAndQuery: string,
  body?: unknown,
  practitionerId?: string
): DemoResponse {
  const [rawPath, rawQuery = ""] = pathAndQuery.split("?", 2)
  const path = rawPath.replace(/^\/+|\/+$/g, "")
  const params = new URLSearchParams(rawQuery)
  const verb = method.toUpperCase()

  if (path === "auth/me") {
    if (!practitionerId) return { status: 401, body: { error: "Not authenticated." } }
    return { status: 200, body: demoAuthMe(practitionerId) }
  }
  if (path === "auth/logout" || path === "auth/changepassword") {
    return { status: 200, body: { ok: true } }
  }
  if (/^admin\/projects\/[^/]+\/invite$/.test(path) && verb === "POST") {
    return handleInvite(body)
  }

  if (path.startsWith("fhir/R4/")) {
    const segments = path.slice("fhir/R4/".length).split("/").map(decodeURIComponent)

    if (segments.length === 1) {
      const [type] = segments
      if (verb === "GET") return { status: 200, body: searchBundle(type, params) }
      if (verb === "POST") {
        const resource = { ...(body as object), resourceType: type, id: crypto.randomUUID() } as AnyResource
        resource.meta = { ...resource.meta, lastUpdated: iso(new Date()) }
        return { status: 201, body: put(resource) }
      }
    }

    if (segments.length === 2) {
      const [type, id] = segments
      const existing = collection(type).get(id)
      if (verb === "GET") {
        return existing ? { status: 200, body: existing } : notFound(`${type}/${id} not found`)
      }
      if (verb === "PUT") {
        if (!existing) return notFound(`${type}/${id} not found`)
        const updated = { ...(body as object), resourceType: type, id } as AnyResource
        updated.meta = { ...existing.meta, ...updated.meta, lastUpdated: iso(new Date()) }
        return { status: 200, body: put(updated) }
      }
      if (verb === "DELETE") {
        collection(type).delete(id)
        return { status: 200, body: { ok: true } }
      }
    }
  }

  return notFound(`Demo mode does not handle ${verb} ${path}`)
}
