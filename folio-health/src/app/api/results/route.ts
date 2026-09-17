import { NextResponse } from "next/server"
import type { DiagnosticReport, Observation, ServiceRequest } from "@medplum/fhirtypes"
import {
  assertVisible,
  clinicalErrorResponse,
  clinicalSession,
  requireRole,
  stampedCreate,
  stampedUpdate,
} from "@/lib/medplum/clinical"

/**
 * Result an order — the laboratory / imaging unit's write.
 *
 * POST { serviceRequestId,
 *        observations: [{ name, value, unit?, flag? }],   (lab values)
 *        conclusion?: string,                              (report text)
 *        status?: "preliminary" | "final" }
 *
 * Separation of duties from the research (emr-clinical-flows.md §2): the
 * ordering doctor never results; the performing unit never orders. So this
 * route is lab-scientist only (the imaging unit uses the same role in V1),
 * it can only result an ACTIVE order, and it writes:
 *   - one `Observation` per reported value, `basedOn` the order,
 *   - one `DiagnosticReport` (`basedOn` the order, `result` → observations,
 *     `conclusion` = the report text), performer = the caller,
 *   - the ServiceRequest → `completed` (or left active for a preliminary).
 * A final report is immutable: resulting an already-completed order is
 * refused; corrections are an amended report, not an edit.
 */
interface ReportedValue {
  name?: string
  value?: string | number
  unit?: string
  flag?: "H" | "L" | "HH" | "LL" | "A" | "N" | ""
}

export async function POST(request: Request) {
  try {
    const session = await clinicalSession()
    const facility = requireRole(session, ["lab-scientist"], "enter results")

    let body: { serviceRequestId?: string; observations?: ReportedValue[]; conclusion?: string; status?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    }
    if (!body.serviceRequestId) return NextResponse.json({ error: "An order is required." }, { status: 400 })

    const reportStatus = body.status === "preliminary" ? "preliminary" : "final"
    const values = (body.observations ?? []).filter((v) => v?.name?.trim() && v.value !== undefined && v.value !== "")
    const conclusion = String(body.conclusion ?? "").trim()
    if (values.length === 0 && !conclusion) {
      return NextResponse.json({ error: "Enter at least one value or a report." }, { status: 400 })
    }

    const order = await assertVisible<ServiceRequest>(`ServiceRequest/${body.serviceRequestId}`)
    if (order.status !== "active") {
      return NextResponse.json(
        { error: `This order is ${order.status}; only an active order can be resulted.` },
        { status: 409 }
      )
    }
    const patientRef = order.subject?.reference
    if (!patientRef) return NextResponse.json({ error: "The order has no patient." }, { status: 409 })

    const now = new Date().toISOString()
    const performer = session.practitionerRef
      ? [{ reference: session.practitionerRef, display: session.practitionerDisplay }]
      : undefined
    const isImaging = order.category?.[0]?.coding?.[0]?.code === "363679005"

    const created: Observation[] = []
    for (const v of values) {
      const numeric = typeof v.value === "number" ? v.value : Number(v.value)
      const observation: Observation = {
        resourceType: "Observation",
        status: reportStatus,
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: isImaging ? "imaging" : "laboratory",
              },
            ],
          },
        ],
        code: { text: String(v.name).trim() },
        subject: { reference: patientRef, display: order.subject?.display },
        ...(order.encounter ? { encounter: order.encounter } : {}),
        basedOn: [{ reference: `ServiceRequest/${order.id}` }],
        effectiveDateTime: now,
        issued: now,
        ...(performer ? { performer } : {}),
        ...(Number.isFinite(numeric) && String(v.value).trim() !== ""
          ? { valueQuantity: { value: numeric, ...(v.unit ? { unit: v.unit } : {}) } }
          : { valueString: String(v.value) }),
        ...(v.flag
          ? {
              interpretation: [
                {
                  coding: [
                    {
                      system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                      code: v.flag,
                    },
                  ],
                },
              ],
            }
          : {}),
      }
      created.push(await stampedCreate<Observation>(observation, facility))
    }

    const report = await stampedCreate<DiagnosticReport>(
      {
        resourceType: "DiagnosticReport",
        status: reportStatus,
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v2-0074",
                code: isImaging ? "RAD" : "LAB",
                display: isImaging ? "Radiology" : "Laboratory",
              },
            ],
          },
        ],
        code: order.code ?? { text: isImaging ? "Imaging report" : "Laboratory report" },
        subject: { reference: patientRef, display: order.subject?.display },
        ...(order.encounter ? { encounter: order.encounter } : {}),
        basedOn: [{ reference: `ServiceRequest/${order.id}` }],
        effectiveDateTime: now,
        issued: now,
        ...(performer ? { performer } : {}),
        result: created.map((o) => ({ reference: `Observation/${o.id}` })),
        ...(conclusion ? { conclusion: conclusion.slice(0, 4000) } : {}),
      },
      facility
    )

    let updatedOrder = order
    if (reportStatus === "final") {
      updatedOrder = await stampedUpdate<ServiceRequest>(
        `ServiceRequest/${order.id}`,
        (existing) => ({ ...existing, status: "completed" }),
        facility
      )
    }

    return NextResponse.json({ report, observations: created, order: updatedOrder }, { status: 201 })
  } catch (error) {
    const { status, body } = clinicalErrorResponse(error, "Could not save the result.")
    return NextResponse.json(body, { status })
  }
}
