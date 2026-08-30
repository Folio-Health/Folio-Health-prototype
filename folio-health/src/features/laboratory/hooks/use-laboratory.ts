"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  DiagnosticReport,
  Observation,
  Patient,
  Practitioner,
  Reference,
  Resource,
  ServiceRequest,
} from "@medplum/fhirtypes"
import { createResource, readResource, searchResources, updateResource } from "@/lib/fhir/client"
import { formatHumanName, toPatientSummary } from "@/lib/fhir/patient"
import {
  buildDiagnosticReport,
  buildLabOrder,
  buildResultObservations,
  toLabOrder,
  toLabResult,
  type BuildOrderInput,
  type BuildResultInput,
} from "@/lib/fhir/laboratory"
import type { LabOrder, LabResult } from "@/lib/mock/laboratory"

/**
 * Laboratory data from Medplum.
 *
 * Replaces `LAB_RESULTS` / `LAB_ORDERS` from the mock layer, which are now
 * empty arrays — so the laboratory hub showed nothing and its "order test"
 * action produced no record anywhere.
 */

const PAGE_SIZE = 100

/** Patient names, resolved from `_include`d Patients in the same bundle. */
function patientNames(resources: Resource[]): Map<string, string> {
  const names = new Map<string, string>()
  for (const resource of resources) {
    if (resource.resourceType !== "Patient") continue
    const patient = resource as Patient
    if (patient.id) names.set(patient.id, toPatientSummary(patient).name)
  }
  return names
}

export interface LabResultWithPatient extends LabResult {
  patientName?: string
}

/**
 * Reports plus the Observations they reference.
 *
 * `_include=DiagnosticReport:result` pulls the Observations in the SAME request.
 * Fetching them per report would be one round trip per row, which on a slow
 * link is the difference between a page that loads and one that does not.
 */
export function useLabResults(enabled = true) {
  return useQuery({
    queryKey: ["lab-results"],
    enabled,
    queryFn: async (): Promise<LabResultWithPatient[]> => {
      const { resources } = await searchResources<Resource>("DiagnosticReport", {
        _count: PAGE_SIZE,
        _sort: "-issued",
        _include: ["DiagnosticReport:result", "DiagnosticReport:subject"],
      })

      const reports = resources.filter(
        (r): r is DiagnosticReport => r.resourceType === "DiagnosticReport"
      )
      const observations = new Map<string, Observation>()
      for (const resource of resources) {
        if (resource.resourceType === "Observation" && resource.id) {
          observations.set(`Observation/${resource.id}`, resource as Observation)
        }
      }
      const names = patientNames(resources)

      return reports.map((report) => {
        const result = toLabResult(report, { observations })
        return { ...result, patientName: names.get(result.patientId) }
      })
    },
  })
}

export interface LabOrderWithPatient extends LabOrder {
  patientName?: string
}

/** Laboratory ServiceRequests — what has been asked for but not yet reported. */
export function useLabOrders(enabled = true) {
  return useQuery({
    queryKey: ["lab-orders"],
    enabled,
    queryFn: async (): Promise<LabOrderWithPatient[]> => {
      const { resources } = await searchResources<Resource>("ServiceRequest", {
        _count: PAGE_SIZE,
        _sort: "-authored",
        // SNOMED "Laboratory procedure" — set by buildLabOrder, and the only
        // way to tell a lab request from a radiology or referral one.
        category: "http://snomed.info/sct|108252007",
        _include: "ServiceRequest:subject",
      })

      const requests = resources.filter(
        (r): r is ServiceRequest => r.resourceType === "ServiceRequest"
      )
      const names = patientNames(resources)

      return requests.map((request) => {
        const order = toLabOrder(request)
        return { ...order, patientName: names.get(order.patientId) }
      })
    },
  })
}

/** One report, with its Observations and the order that produced it. */
export function useLabResult(reportId: string | undefined) {
  return useQuery({
    queryKey: ["lab-result", reportId],
    enabled: Boolean(reportId),
    queryFn: async (): Promise<LabResultWithPatient | null> => {
      if (!reportId) return null
      const report = await readResource<DiagnosticReport>("DiagnosticReport", reportId)

      const observations = new Map<string, Observation>()
      for (const reference of report.result ?? []) {
        const id = reference.reference?.split("/")[1]
        if (!id) continue
        try {
          const observation = await readResource<Observation>("Observation", id)
          observations.set(`Observation/${id}`, observation)
        } catch {
          // A referenced Observation the caller may not read (or that was
          // deleted) must not blank the whole report — the rest still stands.
        }
      }

      // The order carries the requester and the ordered-at date; the report
      // alone cannot say who asked for the test.
      let request: ServiceRequest | undefined
      const basedOn = report.basedOn?.find((r) => r.reference?.startsWith("ServiceRequest/"))
      const requestId = basedOn?.reference?.split("/")[1]
      if (requestId) {
        try {
          request = await readResource<ServiceRequest>("ServiceRequest", requestId)
        } catch {
          // Same reasoning: a missing order degrades the view, it does not break it.
        }
      }

      const practitioners = new Map<string, string>()
      const performerRef = report.performer?.[0]?.reference
      if (performerRef?.startsWith("Practitioner/")) {
        try {
          const practitioner = await readResource<Practitioner>(
            "Practitioner",
            performerRef.split("/")[1]
          )
          practitioners.set(performerRef, formatHumanName(practitioner.name?.[0]).full)
        } catch {
          // Fall through — `approvedBy` stays null rather than showing an id.
        }
      }

      const result = toLabResult(report, { observations, request, practitioners })

      let patientName: string | undefined
      if (result.patientId) {
        try {
          const patient = await readResource<Patient>("Patient", result.patientId)
          patientName = toPatientSummary(patient).name
        } catch {
          // Name unresolved; the id still links to the patient record.
        }
      }

      return { ...result, patientName }
    },
  })
}

export function useCreateLabOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BuildOrderInput) => createResource(buildLabOrder(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] })
    },
  })
}

/**
 * Record a result: Observations first, then the report that references them.
 *
 * Ordering matters. A DiagnosticReport written first would reference
 * Observations that do not exist yet, and any reader hitting that window sees a
 * report with no values — indistinguishable from a test that came back empty.
 */
export function useRecordLabResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: BuildResultInput) => {
      const observations = buildResultObservations(input)
      const refs: Reference<Observation>[] = []
      for (const observation of observations) {
        const created = await createResource(observation)
        if (created.id) refs.push({ reference: `Observation/${created.id}` })
      }
      return createResource(buildDiagnosticReport(input, refs))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-results"] })
      queryClient.invalidateQueries({ queryKey: ["lab-orders"] })
    },
  })
}

/**
 * Approve a report: `preliminary` becomes `final`.
 *
 * Read-then-write rather than a blind PUT, so a concurrent edit to the
 * conclusion or the result list is not silently reverted by the approval.
 */
export function useApproveLabResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      reportId,
      performer,
    }: {
      reportId: string
      performer?: Reference<Practitioner>
    }) => {
      const report = await readResource<DiagnosticReport>("DiagnosticReport", reportId)
      return updateResource<DiagnosticReport>({
        ...report,
        status: "final",
        issued: new Date().toISOString(),
        ...(performer ? { performer: [performer] } : {}),
      })
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lab-results"] })
      queryClient.invalidateQueries({ queryKey: ["lab-result", variables.reportId] })
    },
  })
}
