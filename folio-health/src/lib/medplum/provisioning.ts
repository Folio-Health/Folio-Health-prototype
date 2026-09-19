import "server-only"

import { randomInt } from "node:crypto"
import type { Practitioner, Reference } from "@medplum/fhirtypes"
import {
  FOLIO_ROLE_SYSTEM,
  ROLE_ACCESS_POLICY_NAMES,
  TEMP_CREDENTIAL_EXTENSION_URL,
  type RoleId,
} from "@/lib/auth/roles"
import { AdminError, findAccessPolicyByName, medplumFetch } from "./admin"

/**
 * Shared account-provisioning steps.
 *
 * Two callers create accounts — the operator creating a facility administrator,
 * and a facility administrator creating their own staff. They must produce
 * IDENTICAL accounts: same password shape, same role identifier, same
 * first-login flag. Keeping the steps in one place is what stops the two paths
 * drifting into "staff accounts don't get forced to change their password".
 */

/** Ambiguous characters removed: this gets read aloud or copied off a screen. */
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"

export function generateTempPassword(length = 14): string {
  let out = ""
  for (let i = 0; i < length; i++) {
    out += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]
  }
  // Guarantee a symbol so it satisfies any downstream complexity rule.
  return `${out}#7`
}

export interface InviteResult {
  practitionerId: string
  tempPassword: string
}

interface InviteResponse {
  id?: string
  profile?: { reference?: string; display?: string }
}

/**
 * Invite a user, bind them to a facility-scoped policy, and stamp their role
 * plus the first-login credential flag.
 *
 * `sendEmail: false` — the temporary password is handed over in person, because
 * clinic email is unreliable and a mailed credential is a credential in transit.
 */
export async function inviteFacilityUser(options: {
  projectId: string
  role: Exclude<RoleId, "platform-admin">
  firstName: string
  lastName: string
  email: string
  facility: Reference
}): Promise<InviteResult> {
  const { projectId, role, firstName, lastName, email, facility } = options

  // Referenced, never rebuilt here — see ROLE_ACCESS_POLICY_NAMES.
  const policy = await findAccessPolicyByName(ROLE_ACCESS_POLICY_NAMES[role])

  const tempPassword = generateTempPassword()
  // Medplum's invite is a project-admin operation. The caller's route has
  // already passed requirePlatformAdmin / requireFacilityProvisioner, so the
  // call itself is carried out by the service identity (see medplumFetch).
  const invite = await medplumFetch<InviteResponse>(
    `admin/projects/${encodeURIComponent(projectId)}/invite`,
    {
      privileged: true,
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
              parameter: [{ name: "organization", valueReference: facility }],
            },
          ],
        },
      }),
    }
  )

  const profileRef = invite.profile?.reference
  if (!profileRef?.startsWith("Practitioner/")) {
    // Fatal, not skippable: an un-tagged, un-flagged account would still sign in
    // but with no role and NO forced password change — the temporary password
    // the creator knows would silently become permanent.
    throw new AdminError(
      "The account was created but returned no Practitioner profile, so its role and " +
        "temporary-credential flag could not be stamped. Complete it with the provisioning " +
        "script before giving out the password.",
      500
    )
  }

  const practitionerId = profileRef.split("/")[1]
  await stampPractitioner({ practitionerId, role, facility })

  return { practitionerId, tempPassword }
}

/**
 * Write the role identifier and the first-login flag onto a Practitioner.
 *
 * Read-then-write, preserving anything already present: a blind overwrite would
 * drop identifiers and extensions this app does not know about.
 */
export async function stampPractitioner(options: {
  practitionerId: string
  role: Exclude<RoleId, "platform-admin">
  facility: Reference
}): Promise<void> {
  const { practitionerId, role, facility } = options
  const practitioner = await medplumFetch<Practitioner>(`fhir/R4/Practitioner/${practitionerId}`, {
    privileged: true,
  })

  const identifier = [
    ...(practitioner.identifier ?? []).filter((i) => i.system !== FOLIO_ROLE_SYSTEM),
    { system: FOLIO_ROLE_SYSTEM, value: role },
  ]
  const extension = [
    ...(practitioner.extension ?? []).filter((e) => e.url !== TEMP_CREDENTIAL_EXTENSION_URL),
    { url: TEMP_CREDENTIAL_EXTENSION_URL, valueBoolean: true },
  ]

  // `meta.account` is attempted to match the reference provisioning script, but
  // VERIFIED NOT TO PERSIST on this deployment — Medplum strips a client-set
  // account on Practitioner. That is not a tenancy hole: the binding that
  // actually scopes access is the membership's %organization parameter. Kept so
  // the two provisioning paths stay identical if the server ever accepts it.
  await medplumFetch<Practitioner>(`fhir/R4/Practitioner/${practitionerId}`, {
    privileged: true,
    method: "PUT",
    body: JSON.stringify({
      ...practitioner,
      identifier,
      extension,
      meta: { ...practitioner.meta, account: facility },
    }),
  })
}
