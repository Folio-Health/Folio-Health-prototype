"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Consent, Patient, Procedure, Resource } from "@medplum/fhirtypes"
import { createResource, readResource, searchResources, updateResource } from "@/lib/fhir/client"
import { toPatientSummary } from "@/lib/fhir/patient"
import {
  buildConsent,
  buildSurgery,
  signConsent,
  toConsentForm,
  toPreOpChecklist,
  toProcedureNote,
  toSurgery,
  withChecklist,
  withProcedureNote,
  withSurgeryStatus,
  type BuildConsentInput,
  type BuildSurgeryInput,
} from "@/lib/fhir/surgery"
import type {
  ConsentForm,
  PreOpChecklist,
  ProcedureNote,
  Surgery,
  SurgeryStatus,
} from "@/lib/mock/surgery"

/**
 * Surgery from Medplum.
 *
 * Replaces SURGERIES / PROCEDURE_NOTES / CONSENT_FORMS, all empty arrays since
 * the fabricated records were removed — so the theatre schedule was blank and
 * writing up an operation changed component state that vanished on navigation.
 *
 * A booking and its operative record are ONE Procedure at different statuses,
 * so the schedule, the note and the checklist all read the same resource.
 */

const PAGE_SIZE = 200

export interface SurgeryWithPatient extends Surgery {
  patientName?: string
}

export function useSurgeries(enabled = true) {
  return useQuery({
    queryKey: ["surgeries"],
    enabled,
    queryFn: async (): Promise<SurgeryWithPatient[]> => {
      const { resources } = await searchResources<Resource>("Procedure", {
        _count: PAGE_SIZE,
        _sort: "-date",
        _include: "Procedure:subject",
      })

      const procedures = resources.filter((r): r is Procedure => r.resourceType === "Procedure")
      const names = new Map<string, string>()
      for (const resource of resources) {
        if (resource.resourceType !== "Patient") continue
        const patient = resource as Patient
        if (patient.id) names.set(patient.id, toPatientSummary(patient).name)
      }

      return procedures
        .map(toSurgery)
        .map((s) => ({ ...s, patientName: names.get(s.patientId) }))
    },
  })
}

/** One operation, with its note and checklist — all from the same Procedure. */
export function useSurgery(surgeryId: string | undefined) {
  return useQuery({
    queryKey: ["surgery", surgeryId],
    enabled: Boolean(surgeryId),
    queryFn: async (): Promise<{
      surgery: SurgeryWithPatient
      note: ProcedureNote
      checklist: PreOpChecklist
    } | null> => {
      if (!surgeryId) return null
      const procedure = await readResource<Procedure>("Procedure", surgeryId)
      const surgery = toSurgery(procedure)

      let patientName: string | undefined
      if (surgery.patientId) {
        try {
          patientName = toPatientSummary(
            await readResource<Patient>("Patient", surgery.patientId)
          ).name
        } catch {
          // Unresolved name still leaves a usable record and a working link.
        }
      }

      return {
        surgery: { ...surgery, patientName },
        note: toProcedureNote(procedure),
        checklist: toPreOpChecklist(procedure),
      }
    },
  })
}

export function useScheduleSurgery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BuildSurgeryInput) => createResource(buildSurgery(input)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["surgeries"] }),
  })
}

export function useSetSurgeryStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ surgeryId, status }: { surgeryId: string; status: SurgeryStatus }) => {
      // Read-then-write so a status change does not revert the operative note
      // or the checklist stored on the same resource.
      const procedure = await readResource<Procedure>("Procedure", surgeryId)
      return updateResource<Procedure>(withSurgeryStatus(procedure, status))
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["surgeries"] })
      queryClient.invalidateQueries({ queryKey: ["surgery", variables.surgeryId] })
    },
  })
}

/** Write up an operation. Completes the procedure as part of the same write. */
export function useRecordProcedureNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      surgeryId,
      note,
    }: {
      surgeryId: string
      note: Omit<ProcedureNote, "surgeryId" | "createdAt">
    }) => {
      const procedure = await readResource<Procedure>("Procedure", surgeryId)
      return updateResource<Procedure>(withProcedureNote(procedure, note))
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["surgeries"] })
      queryClient.invalidateQueries({ queryKey: ["surgery", variables.surgeryId] })
    },
  })
}

export function useSaveChecklist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      surgeryId,
      items,
    }: {
      surgeryId: string
      items: Record<string, boolean>
    }) => {
      const procedure = await readResource<Procedure>("Procedure", surgeryId)
      return updateResource<Procedure>(withChecklist(procedure, items))
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["surgery", variables.surgeryId] })
    },
  })
}

// -- Consent ----------------------------------------------------------------

export function useConsentForms(enabled = true) {
  return useQuery({
    queryKey: ["consent-forms"],
    enabled,
    queryFn: async (): Promise<ConsentForm[]> => {
      const [{ resources: consents }, { resources: procedures }] = await Promise.all([
        searchResources<Consent>("Consent", { _count: PAGE_SIZE, _sort: "-_lastUpdated" }),
        searchResources<Procedure>("Procedure", { _count: PAGE_SIZE }),
      ])

      // The consent names the procedure it covers by reference; the procedure
      // name is looked up once rather than fetched per form.
      const procedureNames = new Map<string, string>()
      for (const procedure of procedures) {
        if (procedure.id) procedureNames.set(procedure.id, toSurgery(procedure).procedure)
      }

      return consents.map((consent) => {
        const form = toConsentForm(consent, "")
        return { ...form, procedure: procedureNames.get(form.surgeryId) ?? "Procedure" }
      })
    },
  })
}

export function useCreateConsent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BuildConsentInput) => createResource(buildConsent(input)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["consent-forms"] }),
  })
}

/**
 * Record that a consent was signed.
 *
 * Separate from creation on purpose: a form existing is not the same as a
 * patient having agreed, and one action doing both would let an unsigned form
 * count as consent.
 */
export function useSignConsent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ consentId, signedBy }: { consentId: string; signedBy: string }) => {
      const consent = await readResource<Consent>("Consent", consentId)
      return updateResource<Consent>(signConsent(consent, signedBy))
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["consent-forms"] }),
  })
}
