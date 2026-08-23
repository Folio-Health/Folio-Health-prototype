/**
 * Which facility a signed-in user is bound to, read off Medplum's `auth/me`.
 *
 * The binding that actually scopes a facility user's access is the
 * `%organization` parameter on their ProjectMembership.access entry. Medplum's
 * `auth/me`, however, returns a TRIMMED membership — `{ resourceType, id,
 * user, profile }` and (for operators) `admin` — so `membership.access` is
 * never present in production and cannot be relied on.
 *
 * What `auth/me` does return is `accessPolicy`: the user's policy as the server
 * compiled it, with `%organization` already substituted — every scoped entry
 * reads `"<Type>?_compartment=Organization/<id>"`. That is server-computed from
 * the membership, not user-editable, so it is as trustworthy as the membership
 * itself. It is the primary source here; `membership.access` is still honoured
 * first for servers (and the demo store) that do return it.
 *
 * Deliberately free of `server-only` and of Medplum imports: pure parsing,
 * usable from route handlers, the admin plane and tests alike.
 */

export interface FacilityBinding {
  /** `Organization/<id>` */
  reference: string
  display?: string
}

export interface AuthMeLike {
  membership?: {
    admin?: boolean
    access?: {
      parameter?: { name?: string; valueReference?: { reference?: string; display?: string } }[]
    }[]
  }
  accessPolicy?: {
    resource?: { criteria?: string; compartment?: { reference?: string } }[]
  }
}

const ORGANIZATION_REF = /Organization\/([A-Za-z0-9\-.]{1,64})/

/**
 * Every facility the user is bound to, de-duplicated, in discovery order.
 * Empty for the platform operator and for unprovisioned accounts.
 */
export function facilityBindingsFromAuthMe(me: AuthMeLike | null | undefined): FacilityBinding[] {
  const found = new Map<string, FacilityBinding>()
  const add = (reference: string | undefined, display?: string) => {
    if (!reference || !ORGANIZATION_REF.test(reference)) return
    const existing = found.get(reference)
    if (!existing) found.set(reference, { reference, display })
    else if (!existing.display && display) existing.display = display
  }

  // 1. The membership's own binding, when the server includes it.
  for (const entry of me?.membership?.access ?? []) {
    for (const p of entry.parameter ?? []) {
      if (p?.name === "organization") add(p.valueReference?.reference, p.valueReference?.display)
    }
  }

  // 2. The compiled policy: `%organization` substituted into each criteria.
  for (const entry of me?.accessPolicy?.resource ?? []) {
    const compartment = entry.criteria?.match(/_compartment=(Organization\/[A-Za-z0-9\-.]{1,64})/)
    if (compartment) add(compartment[1])
    add(entry.compartment?.reference)
  }

  return Array.from(found.values())
}

/** The user's primary facility (first binding), or null. */
export function primaryFacilityFromAuthMe(me: AuthMeLike | null | undefined): FacilityBinding | null {
  return facilityBindingsFromAuthMe(me)[0] ?? null
}
