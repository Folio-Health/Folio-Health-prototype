import { NextResponse } from "next/server"
import type { Organization } from "@medplum/fhirtypes"
import { AdminError, medplumFetch, requirePlatformAdmin } from "@/lib/medplum/admin"

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

    const organization: Organization = {
      resourceType: "Organization",
      active: true,
      name,
      type: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/organization-type",
              code: "prov",
              display: "Healthcare Provider",
            },
          ],
          text: "Healthcare Provider",
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
