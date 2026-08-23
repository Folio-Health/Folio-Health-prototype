"use client"

import type { Patient as FhirPatient } from "@medplum/fhirtypes"

/**
 * Register a patient through the server (`/api/patients`), which stamps the
 * caller's facility onto the record with the service identity — a facility
 * user's own token cannot create into their compartment (see the route).
 */
export async function registerPatient(patient: FhirPatient): Promise<FhirPatient> {
  const response = await fetch("/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patient),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body?.error ?? "Could not register the patient.")
  }
  return body as FhirPatient
}
