import { z } from "zod"

/**
 * One rule for every phone field in the app: digits only, at most 11 of them
 * (the Nigerian national format, e.g. 08012345678).
 *
 * Enforced twice on purpose:
 *  - `sanitizePhoneInput` in the input's onChange, so it is impossible to TYPE
 *    anything else (letters, spaces, "+", or a 12th digit are dropped as you
 *    type);
 *  - `phoneSchema` at validation time, so a programmatic or pasted value that
 *    slipped past the input is still rejected before submit.
 */
export const MAX_PHONE_DIGITS = 11
export const MIN_PHONE_DIGITS = 7

export const phoneSchema = z
  .string()
  .min(MIN_PHONE_DIGITS, `Enter at least ${MIN_PHONE_DIGITS} digits`)
  .max(MAX_PHONE_DIGITS, `At most ${MAX_PHONE_DIGITS} digits`)
  .regex(/^\d+$/, "Digits only — no spaces, dashes or +")

/** Optional variant: empty is fine, anything typed must be a valid phone. */
export const optionalPhoneSchema = z.union([z.literal(""), phoneSchema])

/** Keep only digits and cap at MAX_PHONE_DIGITS — wire into the input's onChange. */
export function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, MAX_PHONE_DIGITS)
}

/** Spread onto phone <Input>/<InputGroupInput> elements. */
export const phoneInputProps = {
  type: "tel",
  inputMode: "numeric",
  maxLength: MAX_PHONE_DIGITS,
  placeholder: "08012345678",
} as const
