import type { Basic, Extension, Reference } from "@medplum/fhirtypes"

/**
 * Folio's custom records, stored as FHIR `Basic`.
 *
 * Some things a hospital runs on have no FHIR R4 resource: drug stock levels,
 * purchase orders, ambulance dispatches. `Basic` is the resource FHIR provides
 * for exactly this — a typed container identified by `code`, with the payload
 * in extensions.
 *
 * WHY NOT A BESPOKE TABLE. Everything here inherits Medplum's AccessPolicy
 * enforcement, history, and search for free. A parallel store would need its
 * own authorisation, and "who may see this facility's stock" would then have
 * two answers that could disagree.
 *
 * WHY NOT STRETCH A CLINICAL RESOURCE. SupplyRequest and Transport exist but
 * mean specific things; using them for a purchase order or an ambulance run
 * would put wrong data in a field another system reads literally. A `Basic`
 * with a Folio code is honestly "our own record", not a clinical one wearing a
 * disguise.
 *
 * NOTE ON R5. InventoryItem (R5) and Transport (R5) would replace some of this.
 * Medplum runs R4 here, so these codes are the R4 answer and are the migration
 * point if the server ever moves.
 */

export const FOLIO_BASIC_SYSTEM = "https://folio.health/fhir/sid/record-type"

/** The kinds of Folio record stored as Basic. */
export type FolioRecordType = "purchase-order" | "ambulance-dispatch" | "refund"

export function basicCode(type: FolioRecordType) {
  return { coding: [{ system: FOLIO_BASIC_SYSTEM, code: type }], text: type }
}

export function isFolioRecord(resource: Basic, type: FolioRecordType): boolean {
  return (
    resource.code?.coding?.some((c) => c.system === FOLIO_BASIC_SYSTEM && c.code === type) ?? false
  )
}

/** Extension URLs are namespaced per record type so two kinds cannot collide. */
export function fieldUrl(type: FolioRecordType, field: string): string {
  return `https://folio.health/fhir/StructureDefinition/${type}-${field}`
}

// -- Typed extension access -------------------------------------------------
//
// Extensions are an untyped bag of value[x], so every read goes through these
// rather than reaching in directly. A field read as the wrong value[x] returns
// undefined instead of throwing, which is what "not recorded" should look like.

export function readString(extensions: Extension[] | undefined, url: string): string | undefined {
  return extensions?.find((e) => e.url === url)?.valueString
}

export function readNumber(extensions: Extension[] | undefined, url: string): number | undefined {
  const found = extensions?.find((e) => e.url === url)
  // Integers and decimals are different value[x] slots; a caller should not
  // have to know which one a field was written with.
  return found?.valueInteger ?? found?.valueDecimal
}

export function readDate(extensions: Extension[] | undefined, url: string): string | undefined {
  const found = extensions?.find((e) => e.url === url)
  return found?.valueDateTime ?? found?.valueDate
}

export function readReference(
  extensions: Extension[] | undefined,
  url: string
): string | undefined {
  return extensions?.find((e) => e.url === url)?.valueReference?.reference
}

export function readBoolean(extensions: Extension[] | undefined, url: string): boolean | undefined {
  return extensions?.find((e) => e.url === url)?.valueBoolean
}

// -- Building ---------------------------------------------------------------

type FieldValue = string | number | boolean | Reference | Date | undefined

/**
 * Build an extension array, dropping fields that are undefined.
 *
 * Omission is deliberate: an extension present with an empty value reads as
 * "recorded as nothing", which is a different claim from "not recorded".
 */
export function buildExtensions(
  type: FolioRecordType,
  fields: Record<string, FieldValue>,
  options: { integers?: string[]; dates?: string[] } = {}
): Extension[] {
  const extensions: Extension[] = []

  for (const [field, value] of Object.entries(fields)) {
    if (value === undefined || value === "") continue
    const url = fieldUrl(type, field)

    if (typeof value === "boolean") {
      extensions.push({ url, valueBoolean: value })
    } else if (typeof value === "number") {
      // Counts must be integers; money and measures must not be rounded.
      extensions.push(
        options.integers?.includes(field)
          ? { url, valueInteger: Math.round(value) }
          : { url, valueDecimal: value }
      )
    } else if (value instanceof Date) {
      extensions.push({ url, valueDateTime: value.toISOString() })
    } else if (typeof value === "string") {
      extensions.push(
        options.dates?.includes(field) ? { url, valueDateTime: value } : { url, valueString: value }
      )
    } else {
      extensions.push({ url, valueReference: value })
    }
  }

  return extensions
}
