import { randomInt } from "node:crypto"
import { NextResponse } from "next/server"
import type { Organization, Practitioner } from "@medplum/fhirtypes"
import {
  AdminError,
  FACILITY_ADMIN_ACCESS_POLICY_NAME,
  findAccessPolicyByName,
  medplumFetch,
  requirePlatformAdmin,
} from "@/lib/medplum/admin"
import { FOLIO_ROLE_SYSTEM, TEMP_CREDENTIAL_EXTENSION_URL } from "@/lib/auth/roles"

/**
 * Create a hospital (facility) administrator for one facility.
 *
 * Mirrors apps/clinician-web/scripts/setup-medplum-tenancy.mjs so the two paths
 * provision identical accounts:
 *
 *   1. Resolve the installed facility-admin AccessPolicy (never re-author it).
 *   2. Invite the user, binding the policy to this facility via %organization.
 *   3. Stamp the Practitioner: role identifier, facility owner, and the
 *      temp-credential flag that forces a password change on first sign-in.
 *
 * `sendEmail: false` — the temp password is handed over in person, because
 * clinic email is unreliable and a mailed credential is a credential in transit.
 */

const ROLE_ID = "facility-admin"

/** Ambiguous characters removed: this gets read aloud or copied off a screen. */
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"

function generateTempPassword(length = 14): string {
  let out = ""
  for (let i = 0; i < length; i++) {
    out += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]
  }
  // Guarantee a symbol so it satisfies any downstream complexity rule.
  return `${out}#7`
}

interface InviteResponse {
  id?: string
  profile?: { reference?: string; display?: string }
}

export async function POST(request: Request) {
  try {
    const { projectId } = await requirePlatformAdmin()

    const body = await request.json().catch(() => ({}))
    const facilityId = String(body.facilityId ?? "").trim()
    const firstName = String(body.firstName ?? "").trim()
    const lastName = String(body.lastName ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()

    if (!facilityId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Facility, first name, last name and email are all required." },
        { status: 400 }
      )
    }

    // Confirm the facility exists before creating an account bound to it.
    const facility = await medplumFetch<Organization>(
      `fhir/R4/Organization/${encodeURIComponent(facilityId)}`
    )
    const facilityRef = {
      reference: `Organization/${facility.id}`,
      display: facility.name,
    }

    // 1. The installed policy — referenced, never rebuilt here.
    const policy = await findAccessPolicyByName(FACILITY_ADMIN_ACCESS_POLICY_NAME)

    // 2. Invite, binding the policy to this facility.
    const tempPassword = generateTempPassword()
    const invite = await medplumFetch<InviteResponse>(
      `admin/projects/${encodeURIComponent(projectId)}/invite`,
      {
        method: "POST",
        body: JSON.stringify({
          resourceType: "Practitioner",
          firstName,
          lastName,
          email,
          sendEmail: false,
          password: tempPassword,
          membership: {
            access: [
              {
                policy: { reference: `AccessPolicy/${policy.id}` },
                parameter: [{ name: "organization", valueReference: facilityRef }],
              },
            ],
          },
        }),
      }
    )

    const profileRef = invite.profile?.reference
    if (!profileRef?.startsWith("Practitioner/")) {
      // Fatal, not skippable: an un-tagged, un-flagged account would still be
      // able to sign in but with no role and no forced password change.
      throw new AdminError(
        "The account was created but returned no Practitioner profile, so its role, " +
          "facility and temporary-credential flag could not be stamped. Complete it with " +
          "the provisioning script before giving out the password.",
        500
      )
    }

    // 3. Stamp role + facility ownership + first-login credential flag.
    const practitionerId = profileRef.split("/")[1]
    const practitioner = await medplumFetch<Practitioner>(`fhir/R4/${profileRef}`)

    const identifier = [
      ...(practitioner.identifier ?? []).filter((i) => i.system !== FOLIO_ROLE_SYSTEM),
      { system: FOLIO_ROLE_SYSTEM, value: ROLE_ID },
    ]
    const extension = [
      ...(practitioner.extension ?? []).filter((e) => e.url !== TEMP_CREDENTIAL_EXTENSION_URL),
      { url: TEMP_CREDENTIAL_EXTENSION_URL, valueBoolean: true },
    ]

    // `meta.account` is attempted to match the reference provisioning script,
    // but VERIFIED NOT TO PERSIST on this deployment — Medplum strips a
    // client-set account on Practitioner, which is why all existing
    // practitioners lack it too. That is not a tenancy hole: the facility-admin
    // policy lists Practitioner as `readonly: true` with no compartment
    // criteria (a cross-facility directory resource), and the binding that
    // actually scopes access is the membership's %organization parameter set
    // above. Kept so the two provisioning paths stay identical if the server
    // ever accepts it.
    await medplumFetch<Practitioner>(`fhir/R4/Practitioner/${practitionerId}`, {
      method: "PUT",
      body: JSON.stringify({
        ...practitioner,
        identifier,
        extension,
        meta: { ...practitioner.meta, account: facilityRef },
      }),
    })

    return NextResponse.json({
      practitionerId,
      name: `${firstName} ${lastName}`,
      email,
      facility: facility.name,
      // Returned exactly once — it is not stored anywhere retrievable.
      tempPassword,
    })
  } catch (error) {
    if (error instanceof AdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[admin/facility-admins] failed", error)
    return NextResponse.json({ error: "Could not create the hospital admin." }, { status: 502 })
  }
}
