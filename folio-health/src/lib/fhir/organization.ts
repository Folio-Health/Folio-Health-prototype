import type { Organization } from "@medplum/fhirtypes"

/**
 * Projection of a FHIR `Organization` — a facility.
 *
 * Organization is the tenant boundary: every clinical resource is tagged to the
 * facility that owns it, and a user's AccessPolicy confines them to theirs. So
 * this list is the admin surface for multi-tenancy, not just a directory.
 */
export interface FacilitySummary {
  id: string
  name: string
  /** Human-readable organization type, e.g. "Healthcare Provider". */
  type: string
  active: boolean
  phone: string
  email: string
  address: string
  /** Facility identifier, where one is recorded. */
  identifier: string
  partOf?: string
}

function firstTelecom(organization: Organization, system: "phone" | "email"): string {
  return organization.telecom?.find((t) => t.system === system)?.value ?? ""
}

function formatAddress(organization: Organization): string {
  const address = organization.address?.[0]
  if (!address) return ""
  if (address.text) return address.text
  return [address.line?.join(" "), address.city, address.state, address.country]
    .filter(Boolean)
    .join(", ")
}

export function toFacilitySummary(organization: Organization): FacilitySummary {
  return {
    id: organization.id ?? "",
    name: organization.name ?? "Unnamed facility",
    type:
      organization.type?.[0]?.text ??
      organization.type?.[0]?.coding?.[0]?.display ??
      organization.type?.[0]?.coding?.[0]?.code ??
      "—",
    // FHIR treats a missing `active` as true.
    active: organization.active !== false,
    phone: firstTelecom(organization, "phone"),
    email: firstTelecom(organization, "email"),
    address: formatAddress(organization),
    identifier: organization.identifier?.[0]?.value ?? "",
    partOf: organization.partOf?.display,
  }
}
