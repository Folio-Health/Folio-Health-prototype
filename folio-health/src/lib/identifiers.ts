import { z } from "zod"

/**
 * National Identification Number (NIN) — Nigeria's national identity number,
 * issued by NIMC: exactly 11 digits.
 *
 * How EMRs treat national identifiers (docs/research/emr-front-office.md §2):
 * the US has NO national patient identifier (blocked by Congress; systems rely
 * on MRN + probabilistic matching), the UK keys on the NHS Number, and
 * Nigeria's direction under the NHIA Act 2022 is the NIN. The universal best
 * practice this module follows:
 *
 *  - CAPTURE it as a Patient identifier when the patient has one;
 *  - USE it for search-before-create duplicate checking (an exact NIN match
 *    is the strongest dedup signal available);
 *  - NEVER hard-require it — care is not denied to someone without a NIN,
 *    so registration proceeds with the field empty.
 */
export const NIN_SYSTEM = "https://folio.health/fhir/sid/nin"

export const NIN_LENGTH = 11

export const ninSchema = z
  .string()
  .regex(new RegExp(`^\\d{${NIN_LENGTH}}$`), `A NIN is exactly ${NIN_LENGTH} digits`)

/** Optional variant: empty is fine; anything typed must be a full NIN. */
export const optionalNinSchema = z.union([z.literal(""), ninSchema])

/** Keep only digits, capped at NIN length — wire into the input's onChange. */
export function sanitizeNinInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, NIN_LENGTH)
}

/** Spread onto NIN <Input> elements. */
export const ninInputProps = {
  inputMode: "numeric",
  maxLength: NIN_LENGTH,
  placeholder: "11-digit NIN (optional)",
} as const

/**
 * Virtual NIN (VNIN) — NIMC's tokenised stand-in for the NIN: 16 digits,
 * obtained by the patient from the NIMC app or the *346# short code.
 *
 * Why both this and the NIN above (Implementation Manuscript §2): the raw NIN
 * is now treated as too sensitive to use directly as a record key, and the
 * VNIN is the identifier Folio links records on. The NIN stays because it is
 * already wired into search-before-create duplicate checking, where an exact
 * match is the strongest dedup signal available.
 *
 * Both are optional at the desk. Care is not denied to someone who arrives
 * without either, so registration proceeds with the fields empty and the
 * reason recorded.
 */
export const VNIN_SYSTEM = "https://folio.health/fhir/sid/vnin"

export const VNIN_LENGTH = 16

export const vninSchema = z
  .string()
  .regex(new RegExp(`^\d{${VNIN_LENGTH}}$`), `A VNIN is exactly ${VNIN_LENGTH} digits`)

/** Optional variant: empty is fine; anything typed must be a full VNIN. */
export const optionalVninSchema = z.union([z.literal(""), vninSchema])

/** Keep only digits, capped at VNIN length — wire into the input's onChange. */
export function sanitizeVninInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, VNIN_LENGTH)
}

/** Spread onto VNIN <Input> elements. */
export const vninInputProps = {
  inputMode: "numeric",
  maxLength: VNIN_LENGTH,
  placeholder: "16-digit VNIN",
} as const
