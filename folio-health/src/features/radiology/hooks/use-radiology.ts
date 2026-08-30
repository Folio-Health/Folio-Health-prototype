"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  DiagnosticReport,
  Patient,
  Practitioner,
  Resource,
  ServiceRequest,
} from "@medplum/fhirtypes"
import { createResource, readResource, searchResources, updateResource } from "@/lib/fhir/client"
import { toPatientSummary } from "@/lib/fhir/patient"
import {
  RADIOLOGY_CATEGORY,
  buildImagingOrder,
  buildRadiologyReport,
  toImagingRequest,
  toRadiologyReport,
  type BuildImagingOrderInput,
  type BuildRadiologyReportInput,
} from "@/lib/fhir/radiology"
import type { ImagingRequest, RadiologyReport } from "@/lib/mock/radiology"

/**
 * Radiology data from Medplum.
 *
 * Replaces IMAGING_REQUESTS / RADIOLOGY_REPORTS, which are empty arrays since
 * the fabricated records were removed — so the radiology worklist showed
 * nothing and ordering an exam recorded it only in component state.
 */

const PAGE_SIZE = 100

export interface ImagingRequestWithPatient extends ImagingRequest {
  patientName?: string
}

function patientNames(resources: Resource[]): Map<string, string> {
  const names = new Map<string, string>()
  for (const resource of resources) {
    if (resource.resourceType !== "Patient") continue
    const patient = resource as Patient
    if (patient.id) names.set(patient.id, toPatientSummary(patient).name)
  }
  return names
}

/**
 * The imaging worklist: every radiology order, with its report when one exists.
 *
 * Reports are fetched in ONE extra search keyed by `based-on`, not per request.
 * A worklist of fifty exams would otherwise be fifty round trips, which is the
 * difference between a page that loads and one that times out.
 */
export function useImagingRequests(enabled = true) {
  return useQuery({
    queryKey: ["imaging-requests"],
    enabled,
    queryFn: async (): Promise<ImagingRequestWithPatient[]> => {
      const { resources } = await searchResources<Resource>("ServiceRequest", {
        category: `${RADIOLOGY_CATEGORY.system}|${RADIOLOGY_CATEGORY.code}`,
        _count: PAGE_SIZE,
        _sort: "-authored",
        _include: "ServiceRequest:subject",
      })

      const requests = resources.filter(
        (r): r is ServiceRequest => r.resourceType === "ServiceRequest"
      )
      const names = patientNames(resources)
      if (requests.length === 0) return []

      const { resources: reportResources } = await searchResources<DiagnosticReport>(
        "DiagnosticReport",
        {
          "based-on": requests.map((r) => `ServiceRequest/${r.id}`).join(","),
          _count: PAGE_SIZE,
        }
      )
      const reportByRequest = new Map<string, DiagnosticReport>()
      for (const report of reportResources) {
        const basedOn = report.basedOn?.find((r) => r.reference?.startsWith("ServiceRequest/"))
        const requestId = basedOn?.reference?.split("/")[1]
        if (requestId) reportByRequest.set(requestId, report)
      }

      return requests.map((request) => {
        const imaging = toImagingRequest(request, reportByRequest.get(request.id ?? ""))
        return { ...imaging, patientName: names.get(imaging.patientId) }
      })
    },
  })
}

export interface ImagingRequestDetail {
  request: ImagingRequestWithPatient
  report?: RadiologyReport
}

/** One exam and its report, for the viewer. */
export function useImagingRequest(requestId: string | undefined) {
  return useQuery({
    queryKey: ["imaging-request", requestId],
    enabled: Boolean(requestId),
    queryFn: async (): Promise<ImagingRequestDetail | null> => {
      if (!requestId) return null
      const request = await readResource<ServiceRequest>("ServiceRequest", requestId)

      const { resources } = await searchResources<DiagnosticReport>("DiagnosticReport", {
        "based-on": `ServiceRequest/${requestId}`,
        _count: 1,
        _sort: "-issued",
      })
      const report = resources[0]

      const imaging = toImagingRequest(request, report)

      let patientName: string | undefined
      if (imaging.patientId) {
        try {
          patientName = toPatientSummary(
            await readResource<Patient>("Patient", imaging.patientId)
          ).name
        } catch {
          // Unresolved name still leaves a usable record and a working link.
        }
      }

      return {
        request: { ...imaging, patientName },
        report: report ? toRadiologyReport(report) : undefined,
      }
    },
  })
}

export function useCreateImagingOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BuildImagingOrderInput) => createResource(buildImagingOrder(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imaging-requests"] })
    },
  })
}

export function useRecordRadiologyReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: BuildRadiologyReportInput & { requestId?: string }) => {
      const report = await createResource(buildRadiologyReport(input))
      // The order is marked complete only after the report is safely written:
      // reversed, a failure between the two would leave an exam that claims to
      // be done with nothing to show for it.
      if (input.requestId) {
        const request = await readResource<ServiceRequest>("ServiceRequest", input.requestId)
        await updateResource<ServiceRequest>({ ...request, status: "completed" })
      }
      return report
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["imaging-requests"] })
      if (variables.requestId) {
        queryClient.invalidateQueries({ queryKey: ["imaging-request", variables.requestId] })
      }
    },
  })
}

/** Sign a preliminary report off as final. */
export function useApproveRadiologyReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      reportId,
      performer,
    }: {
      reportId: string
      performer?: { reference: string; display?: string }
    }) => {
      const report = await readResource<DiagnosticReport>("DiagnosticReport", reportId)
      return updateResource<DiagnosticReport>({
        ...report,
        status: "final",
        issued: new Date().toISOString(),
        ...(performer
          ? { performer: [performer as { reference: string; display?: string }] }
          : {}),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imaging-requests"] })
      queryClient.invalidateQueries({ queryKey: ["imaging-request"] })
    },
  })
}

export type { Practitioner }
