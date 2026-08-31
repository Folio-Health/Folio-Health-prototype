"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  Encounter,
  Location,
  Patient,
  Resource,
  ServiceRequest,
} from "@medplum/fhirtypes"
import { createResource, readResource, searchResources, updateResource } from "@/lib/fhir/client"
import { toPatientSummary } from "@/lib/fhir/patient"
import {
  buildAdmission,
  buildBed,
  buildWard,
  dischargeEncounter,
  isBed,
  isWard,
  occupiedBedIds,
  buildTransferRequest,
  icuAcuityOf,
  onVentilator,
  toAdmission,
  toBed,
  toTransfer,
  toWard,
  withBedMove,
  withIcuState,
  withReadyForDischarge,
  TRANSFER_CATEGORY,
  TRANSFER_TO_BED_EXTENSION_URL,
  type BuildAdmissionInput,
  type BuildTransferInput,
} from "@/lib/fhir/admissions"
import type {
  Admission,
  Bed,
  ICUPatient,
  ICUStatus,
  Transfer,
  Ward,
} from "@/lib/mock/admissions"

/**
 * Admissions, wards and beds from Medplum.
 *
 * Replaces ADMISSIONS_LIST / WARDS_LIST / BEDS_LIST, all empty arrays since the
 * fabricated records were removed.
 *
 * NOTE ON EMPTY STATE: a fresh Folio project has no Location resources at all,
 * so there are no wards and no beds until someone creates them. That is why
 * ward and bed creation live here rather than being assumed to exist — without
 * them the admissions module cannot admit anyone.
 */

const PAGE_SIZE = 200

/** Wards and beds in one query — both are Locations, told apart by physicalType. */
export function useWardsAndBeds(enabled = true) {
  return useQuery({
    queryKey: ["wards-and-beds"],
    enabled,
    queryFn: async (): Promise<{ wards: Ward[]; beds: Bed[] }> => {
      const [{ resources: locations }, { resources: encounters }] = await Promise.all([
        searchResources<Location>("Location", { _count: PAGE_SIZE, _sort: "name" }),
        // Occupancy is derived from live encounters, not stored on the bed.
        searchResources<Encounter>("Encounter", {
          status: "in-progress",
          _count: PAGE_SIZE,
        }),
      ])

      const occupied = occupiedBedIds(encounters)
      return {
        wards: locations.filter(isWard).map(toWard),
        beds: locations.filter(isBed).map((l) => toBed(l, occupied)),
      }
    },
  })
}

export interface AdmissionWithPatient extends Admission {
  patientName?: string
}

/**
 * Inpatient admissions.
 *
 * @param includeDischarged pass true for the discharge history; the default
 *   returns only current inpatients, which is what a ward list means.
 */
export function useAdmissions(includeDischarged = false, enabled = true) {
  return useQuery({
    queryKey: ["admissions", includeDischarged],
    enabled,
    queryFn: async (): Promise<AdmissionWithPatient[]> => {
      const { resources } = await searchResources<Resource>("Encounter", {
        // IMP = inpatient. Without this the list would include every outpatient
        // visit and consultation as though they were admissions.
        class: "IMP",
        ...(includeDischarged ? {} : { status: "in-progress" }),
        _count: PAGE_SIZE,
        _sort: "-date",
        _include: "Encounter:subject",
      })

      const encounters = resources.filter((r): r is Encounter => r.resourceType === "Encounter")
      const names = new Map<string, string>()
      for (const resource of resources) {
        if (resource.resourceType !== "Patient") continue
        const patient = resource as Patient
        if (patient.id) names.set(patient.id, toPatientSummary(patient).name)
      }

      // The Encounter records the BED; the ward is the bed's parent. Resolved
      // here in one Location fetch rather than one per admission.
      const bedIds = Array.from(
        new Set(encounters.map((e) => toAdmission(e).bedId).filter(Boolean))
      )
      const wardByBed = new Map<string, string>()
      if (bedIds.length > 0) {
        const { resources: beds } = await searchResources<Location>("Location", {
          _id: bedIds.join(","),
          _count: PAGE_SIZE,
        })
        for (const bed of beds) {
          const wardId = bed.partOf?.reference?.split("/")[1]
          if (bed.id && wardId) wardByBed.set(bed.id, wardId)
        }
      }

      return encounters.map((encounter) => {
        const admission = toAdmission(encounter)
        return {
          ...admission,
          wardId: wardByBed.get(admission.bedId) ?? "",
          patientName: names.get(admission.patientId),
        }
      })
    },
  })
}

export function useCreateWard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof buildWard>[0]) => createResource(buildWard(input)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["wards-and-beds"] }),
  })
}

/**
 * Create beds in a ward.
 *
 * Sequential rather than parallel: Medplum rate-limits bursts, and a ward that
 * half-created its beds is more confusing than one that failed outright and can
 * simply be retried.
 */
export function useCreateBeds() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      wardId,
      labels,
    }: {
      wardId: string
      labels: string[]
    }): Promise<Location[]> => {
      const created: Location[] = []
      for (const label of labels) {
        created.push(await createResource(buildBed({ label, wardId })))
      }
      return created
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["wards-and-beds"] }),
  })
}

export function useAdmitPatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BuildAdmissionInput) => createResource(buildAdmission(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] })
      // The bed the patient just took is now occupied.
      queryClient.invalidateQueries({ queryKey: ["wards-and-beds"] })
    },
  })
}

/**
 * Mark an admission ready for discharge (or clear the flag).
 *
 * Read-then-write: the flag lives in extension[] alongside anything else stored
 * there, and a blind overwrite would drop extensions this app does not own.
 */
export function useMarkReadyForDischarge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ encounterId, ready }: { encounterId: string; ready: boolean }) => {
      const encounter = await readResource<Encounter>("Encounter", encounterId)
      return updateResource<Encounter>(withReadyForDischarge(encounter, ready))
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admissions"] }),
  })
}

/**
 * Discharge: close the encounter AND end the bed occupancy.
 *
 * Read-then-write so a concurrent edit elsewhere on the encounter is not
 * reverted by the discharge.
 */
export function useDischargePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (encounterId: string) => {
      const encounter = await readResource<Encounter>("Encounter", encounterId)
      return updateResource<Encounter>(dischargeEncounter(encounter))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] })
      queryClient.invalidateQueries({ queryKey: ["wards-and-beds"] })
    },
  })
}

// -- Transfers ---------------------------------------------------------------

export interface TransferWithNames extends Transfer {
  patientName?: string
  fromBedLabel?: string
  toBedLabel?: string
}

/**
 * Ward transfer requests.
 *
 * Bed labels and ward ids are resolved in ONE Location fetch covering every bed
 * mentioned by any request, rather than two lookups per row.
 */
export function useTransfers(enabled = true) {
  return useQuery({
    queryKey: ["transfers"],
    enabled,
    queryFn: async (): Promise<TransferWithNames[]> => {
      const { resources } = await searchResources<Resource>("ServiceRequest", {
        category: `${TRANSFER_CATEGORY.system}|${TRANSFER_CATEGORY.code}`,
        _count: PAGE_SIZE,
        _sort: "-authored",
        _include: "ServiceRequest:subject",
      })

      const requests = resources.filter(
        (r): r is ServiceRequest => r.resourceType === "ServiceRequest"
      )
      const names = new Map<string, string>()
      for (const resource of resources) {
        if (resource.resourceType !== "Patient") continue
        const patient = resource as Patient
        if (patient.id) names.set(patient.id, toPatientSummary(patient).name)
      }

      const transfers = requests.map(toTransfer)
      const bedIds = Array.from(
        new Set(transfers.flatMap((t) => [t.fromBedId, t.toBedId]).filter(Boolean))
      )

      const bedLabels = new Map<string, string>()
      const bedWard = new Map<string, string>()
      if (bedIds.length > 0) {
        const { resources: beds } = await searchResources<Location>("Location", {
          _id: bedIds.join(","),
          _count: PAGE_SIZE,
        })
        for (const bed of beds) {
          if (!bed.id) continue
          bedLabels.set(bed.id, bed.name ?? "Bed")
          const wardId = bed.partOf?.reference?.split("/")[1]
          if (wardId) bedWard.set(bed.id, wardId)
        }
      }

      return transfers.map((t) => ({
        ...t,
        fromWardId: bedWard.get(t.fromBedId) ?? "",
        toWardId: bedWard.get(t.toBedId) ?? "",
        fromBedLabel: bedLabels.get(t.fromBedId),
        toBedLabel: bedLabels.get(t.toBedId),
        patientName: names.get(t.patientId),
      }))
    },
  })
}

export function useRequestTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BuildTransferInput) => createResource(buildTransferRequest(input)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["transfers"] }),
  })
}

/**
 * Approve a pending transfer, or complete an approved one.
 *
 * Completing is what actually MOVES the patient: the encounter's current bed is
 * closed and the destination opened. Approving alone changes nothing physical,
 * which is the point of having the two steps.
 */
export function useAdvanceTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      transferId,
      to,
    }: {
      transferId: string
      to: "Approved" | "Completed"
    }) => {
      const request = await readResource<ServiceRequest>("ServiceRequest", transferId)

      if (to === "Approved") {
        return updateResource<ServiceRequest>({ ...request, status: "active" })
      }

      const toBedId = request.extension
        ?.find((e) => e.url === TRANSFER_TO_BED_EXTENSION_URL)
        ?.valueReference?.reference?.split("/")[1]
      const encounterId = request.encounter?.reference?.split("/")[1]
      if (!toBedId || !encounterId) {
        throw new Error("This transfer is missing its destination bed or encounter.")
      }

      // Move first, then mark the request complete. Reversed, a failure between
      // the two would leave a transfer that claims to be done with the patient
      // still in the old bed.
      const encounter = await readResource<Encounter>("Encounter", encounterId)
      await updateResource<Encounter>(withBedMove(encounter, toBedId))
      return updateResource<ServiceRequest>({ ...request, status: "completed" })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] })
      queryClient.invalidateQueries({ queryKey: ["admissions"] })
      queryClient.invalidateQueries({ queryKey: ["wards-and-beds"] })
    },
  })
}

// -- ICU ---------------------------------------------------------------------

export interface IcuPatientRow extends ICUPatient {
  patientName?: string
  bedLabel?: string
}

/**
 * Patients currently in an ICU ward.
 *
 * "ICU" is matched on the ward's department text, which is what the ward
 * creation form captures. A dedicated ICU flag on Location would be firmer;
 * this at least derives the list from where patients actually are, rather than
 * from a separate hand-maintained roster that could disagree with the beds.
 */
export function useIcuPatients(enabled = true) {
  return useQuery({
    queryKey: ["icu-patients"],
    enabled,
    queryFn: async (): Promise<IcuPatientRow[]> => {
      const [{ resources: locations }, { resources: encounterResources }] = await Promise.all([
        searchResources<Location>("Location", { _count: PAGE_SIZE }),
        searchResources<Resource>("Encounter", {
          class: "IMP",
          status: "in-progress",
          _count: PAGE_SIZE,
          _include: "Encounter:subject",
        }),
      ])

      const icuWardIds = new Set(
        locations
          .filter(isWard)
          .filter((w) => /icu|intensive/i.test(w.type?.[0]?.text ?? w.name ?? ""))
          .map((w) => w.id)
          .filter((id): id is string => Boolean(id))
      )
      const bedById = new Map(locations.filter(isBed).map((b) => [b.id ?? "", b]))

      const encounters = encounterResources.filter(
        (r): r is Encounter => r.resourceType === "Encounter"
      )
      const names = new Map<string, string>()
      for (const resource of encounterResources) {
        if (resource.resourceType !== "Patient") continue
        const patient = resource as Patient
        if (patient.id) names.set(patient.id, toPatientSummary(patient).name)
      }

      const rows: IcuPatientRow[] = []
      for (const encounter of encounters) {
        const admission = toAdmission(encounter)
        const bed = bedById.get(admission.bedId)
        const wardId = bed?.partOf?.reference?.split("/")[1]
        if (!wardId || !icuWardIds.has(wardId)) continue

        rows.push({
          admissionId: admission.id,
          patientId: admission.patientId,
          bedId: admission.bedId,
          // Undefined acuity shows as Stable. That is "nobody has set this
          // yet", not a clinical assertion that the patient is stable.
          status: icuAcuityOf(encounter) ?? "Stable",
          onVentilator: onVentilator(encounter),
          // Vitals are read by the board from the vitals hook, which holds real
          // Observations. This query does not invent numbers to fill the shape.
          vitals: { hr: 0, bp: "—", spo2: 0, temp: 0 },
          patientName: names.get(admission.patientId),
          bedLabel: bed?.name,
        })
      }
      return rows
    },
  })
}

export function useSetIcuState() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      encounterId,
      acuity,
      onVentilator: ventilated,
    }: {
      encounterId: string
      acuity?: ICUStatus
      onVentilator?: boolean
    }) => {
      const encounter = await readResource<Encounter>("Encounter", encounterId)
      return updateResource<Encounter>(
        withIcuState(encounter, { acuity, onVentilator: ventilated })
      )
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["icu-patients"] }),
  })
}
