/**
 * Facility types, from the HL7 `organization-type` value set.
 *
 * A deliberate subset of the standard codes rather than invented strings, so
 * the data stays portable to any FHIR server. `prov` covers hospitals, clinics
 * and labs alike — FHIR does not sub-type providers here; a finer taxonomy
 * (hospital vs. maternity vs. diagnostic lab) belongs in a separate coding, not
 * in a hand-rolled value for this field.
 */
export const ORGANIZATION_TYPE_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/organization-type"

export interface OrganizationTypeOption {
  code: string
  display: string
  /** Shown under the option so an operator picks the right one. */
  hint: string
}

export const ORGANIZATION_TYPES: OrganizationTypeOption[] = [
  {
    code: "prov",
    display: "Healthcare Provider",
    hint: "Hospital, clinic, maternity or diagnostic lab that treats patients",
  },
  {
    code: "dept",
    display: "Hospital Department",
    hint: "A unit belonging to a larger facility",
  },
  {
    code: "ins",
    display: "Insurance Company / HMO",
    hint: "Pays for care rather than delivering it",
  },
  {
    code: "govt",
    display: "Government",
    hint: "Ministry, agency or public health authority",
  },
  {
    code: "edu",
    display: "Educational Institute",
    hint: "Teaching or training institution",
  },
  { code: "other", display: "Other", hint: "None of the above" },
]

export const DEFAULT_ORGANIZATION_TYPE = "prov"

export function organizationTypeDisplay(code: string | undefined): string {
  return ORGANIZATION_TYPES.find((t) => t.code === code)?.display ?? "—"
}
