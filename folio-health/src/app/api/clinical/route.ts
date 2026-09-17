import { NextResponse } from "next/server"
import type {
  AllergyIntolerance,
  Composition,
  Condition,
  Encounter,
  MedicationRequest,
  Patient,
  Resource,
  ServiceRequest,
} from "@medplum/fhirtypes"
import { CLERKING_NOTE_LOINC } from "@/lib/clinical/clerking"
import { encounterStatus } from "@/lib/clinical/encounter"
import {
  assertVisible,
  clinicalErrorResponse,
  clinicalSession,
  requireRole,
  stampedCreate,
} from "@/lib/medplum/clinical"

/**
 * Create a clinical record during a consultation — doctor only.
 *
 * POST { resource }  where resource.resourceType is one of:
 *   Composition        the clerking note (always created as a DRAFT —
 *                      `preliminary`; signing is a separate action)
 *   Condition          encounter diagnosis (provisional / differential)
 *   AllergyIntolerance drug allergy recorded from the drug history
 *   ServiceRequest     lab or imaging order (category laboratory | imaging)
 *   MedicationRequest  prescription
 *
 * The route owns the trust-critical fields: the subject must be a patient
 * at the caller's facility (checked with the caller's own token), the
 * encounter must be open, and author/requester/recorder is set to the
 * signed-in doctor — never taken from the body.
 */

type Allowed = Composition | Condition | AllergyIntolerance | ServiceRequest | MedicationRequest
const ALLOWED_TYPES = new Set(["Composition", "Condition", "AllergyIntolerance", "ServiceRequest", "MedicationRequest"])

function subjectOf(resource: Resource): string | undefined {
  const r = resource as { subject?: { reference?: string }; patient?: { reference?: string } }
  return r.subject?.reference ?? r.patient?.reference
}

function encounterOf(resource: Resource): string | undefined {
  const r = resource as { encounter?: { reference?: string } }
  return r.encounter?.reference
}

export async function POST(request: Request) {
  try {
    const session = await clinicalSession()
    const facility = requireRole(session, ["doctor"], "write clinical records")

    let body: { resource?: Allowed }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    }
    const resource = body.resource
    if (!resource?.resourceType || !ALLOWED_TYPES.has(resource.resourceType)) {
      return NextResponse.json(
        { error: "resource must be a Composition, Condition, AllergyIntolerance, ServiceRequest or MedicationRequest." },
        { status: 400 }
      )
    }

    const subjectRef = subjectOf(resource)
    if (!subjectRef?.startsWith("Patient/")) {
      return NextResponse.json({ error: "The record must reference a patient." }, { status: 400 })
    }
    const patient = await assertVisible<Patient>(subjectRef)
    const patientName = patient.name?.[0]
    const patientDisplay =
      patientName?.text ?? [patientName?.given?.join(" "), patientName?.family].filter(Boolean).join(" ")

    const encounterRef = encounterOf(resource)
    if (encounterRef) {
      const encounter = await assertVisible<Encounter>(encounterRef)
      const status = encounterStatus(encounter)
      if (status === "finished" || status === "cancelled") {
        return NextResponse.json({ error: "This visit is closed." }, { status: 409 })
      }
    }

    const author = session.practitionerRef
      ? { reference: session.practitionerRef, display: session.practitionerDisplay }
      : undefined
    const now = new Date().toISOString()

    let prepared: Allowed
    switch (resource.resourceType) {
      case "Composition": {
        if (!encounterRef) return NextResponse.json({ error: "A note must belong to a visit." }, { status: 400 })
        prepared = {
          ...(resource as Composition),
          status: "preliminary",
          type: { coding: [{ system: "http://loinc.org", code: CLERKING_NOTE_LOINC, display: "Consult note" }], text: "Clerking note" },
          subject: { reference: subjectRef, display: patientDisplay || undefined },
          date: now,
          author: author ? [author] : [],
          title: (resource as Composition).title ?? "Clerking note",
          attester: undefined,
        }
        break
      }
      case "Condition":
        prepared = {
          ...(resource as Condition),
          subject: { reference: subjectRef, display: patientDisplay || undefined },
          recordedDate: now,
          ...(author ? { recorder: author, asserter: author } : {}),
        }
        break
      case "AllergyIntolerance":
        prepared = {
          ...(resource as AllergyIntolerance),
          patient: { reference: subjectRef, display: patientDisplay || undefined },
          recordedDate: now,
          ...(author ? { recorder: author, asserter: author } : {}),
        }
        break
      case "ServiceRequest": {
        const sr = resource as ServiceRequest
        const category = sr.category?.[0]?.coding?.[0]?.code
        if (category !== "108252007" && category !== "363679005") {
          return NextResponse.json(
            { error: "An order must be a laboratory (108252007) or imaging (363679005) request." },
            { status: 400 }
          )
        }
        if (!sr.code?.text && !sr.code?.coding?.length) {
          return NextResponse.json({ error: "Say which test or study is being ordered." }, { status: 400 })
        }
        prepared = {
          ...sr,
          status: "active",
          intent: "order",
          subject: { reference: subjectRef, display: patientDisplay || undefined },
          authoredOn: now,
          ...(author ? { requester: author } : {}),
        }
        break
      }
      case "MedicationRequest": {
        const mr = resource as MedicationRequest
        if (!mr.medicationCodeableConcept?.text) {
          return NextResponse.json({ error: "Say which medication is being prescribed." }, { status: 400 })
        }
        prepared = {
          ...mr,
          status: "active",
          intent: "order",
          subject: { reference: subjectRef, display: patientDisplay || undefined },
          authoredOn: now,
          ...(author ? { requester: author } : {}),
        }
        break
      }
      default:
        return NextResponse.json({ error: "Unsupported resource." }, { status: 400 })
    }

    const created = await stampedCreate(prepared, facility)
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    const { status, body } = clinicalErrorResponse(error, "Could not save the record.")
    return NextResponse.json(body, { status })
  }
}
