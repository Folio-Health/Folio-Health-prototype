import { NextResponse } from "next/server"
import type { Organization } from "@medplum/fhirtypes"
import { AdminError, medplumFetch, requirePlatformAdmin } from "@/lib/medplum/admin"
import {
  DEFAULT_ORGANIZATION_TYPE,
  ORGANIZATION_TYPES,
  ORGANIZATION_TYPE_SYSTEM,
} from "@/lib/fhir/organization-types"

/** Facility registration / licence number recorded at onboarding. */
export const FACILITY_IDENTIFIER_SYSTEM = "https://folio.health/fhir/sid/facility"

/**
 * Register a facility (FHIR `Organization`) — the tenant boundary.
 *
 * Platform plane only: onboarding facilities is the operator's job
 * (architecture §7, "Onboarding chain").
 */
export async function POST(request: Request) {
  try {
    await requirePlatformAdmin()

    const body = await request.json().catch(() => ({}))
    const name = String(body.name ?? "").trim()
    if (!name) {
      return NextResponse.json({ error: "Facility name is required." }, { status: 400 })
    }

    // Names are the human handle for a tenant and are matched by the
    // provisioning tooling, so a duplicate is an operator error worth catching
    // rather than silently creating a second identically-named facility.
    const existing = await medplumFetch<{ entry?: { resource?: Organization }[] }>(
      `fhir/R4/Organization?name:exact=${encodeURIComponent(name)}&_count=1`
    )
    if ((existing.entry ?? []).length > 0) {
      return NextResponse.json(
        { error: `A facility named "${name}" already exists.` },
        { status: 409 }
      )
    }

    const phone = String(body.phone ?? "").trim()
    const email = String(body.email ?? "").trim()
    const addressText = String(body.address ?? "").trim()
    const identifierValue = String(body.identifier ?? "").trim()

    const typeCode = String(body.type ?? DEFAULT_ORGANIZATION_TYPE).trim()
    const chosenType =
      ORGANIZATION_TYPES.find((t) => t.code === typeCode) ??
      ORGANIZATION_TYPES.find((t) => t.code === DEFAULT_ORGANIZATION_TYPE)!

    const organization: Organization = {
      resourceType: "Organization",
      // A newly registered facility is in active use. Deactivation is a
      // deliberate later action, never the starting state.
      active: true,
      name,
      ...(identifierValue
        ? {
            identifier: [
              { system: FACILITY_IDENTIFIER_SYSTEM, value: identifierValue },
            ],
          }
        : {}),
      type: [
        {
          coding: [
            {
              system: ORGANIZATION_TYPE_SYSTEM,
              code: chosenType.code,
              display: chosenType.display,
            },
          ],
          text: chosenType.display,
        },
      ],
      ...(phone || email
        ? {
            telecom: [
              ...(phone ? [{ system: "phone" as const, value: phone }] : []),
              ...(email ? [{ system: "email" as const, value: email }] : []),
            ],
          }
        : {}),
      ...(addressText ? { address: [{ text: addressText }] } : {}),
    }

    const created = await medplumFetch<Organization>("fhir/R4/Organization", {
      method: "POST",
      body: JSON.stringify(organization),
    })

    return NextResponse.json({ id: created.id, name: created.name })
  } catch (error) {
    if (error instanceof AdminError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[admin/facilities] failed", error)
    return NextResponse.json({ error: "Could not create the facility." }, { status: 502 })
  }
}
