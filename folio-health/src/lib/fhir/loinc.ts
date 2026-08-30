/**
 * LOINC codes for Folio's laboratory catalogue.
 *
 * Every test and every analyte it reports is coded here, so results leave this
 * system as interchangeable FHIR rather than as free text only Folio can read.
 *
 * HOW TO READ THIS FILE
 * Each entry carries the code AND the official LOINC long common name. The name
 * is not decoration: it is how a reviewer checks the code without looking it up.
 * If a name here does not match what loinc.org says for that code, the code is
 * wrong — trust the name, fix the code.
 *
 * SPECIMEN AND METHOD MATTER. LOINC distinguishes serum from plasma from whole
 * blood, and automated count from manual. The codes below assume the common
 * hospital case (serum/plasma chemistry, automated haematology). A lab running
 * a different method needs different codes, which is why this table is data
 * rather than being scattered through the builders.
 *
 * ONE ENTRY NEEDS LOCAL CONFIRMATION. Malaria antigen is coded generically
 * (`46094-9`, species-agnostic) because the truthful code depends on which
 * rapid test the lab stocks: a P. falciparum-only HRP2 kit should be `76772-3`
 * instead. The generic code is not wrong, it is merely less specific, so it is
 * safe to ship — but a lab running a Pf-only kit should tighten it.
 *
 * The map supports `undefined` for any entry whose code cannot be confirmed.
 * That is the correct value in that situation: a wrong LOINC code is worse than
 * none, because it is silently wrong forever, propagates into every downstream
 * system, and nothing in the UI ever shows it as suspect. An uncoded entry
 * falls back to `code.text` and still reads correctly to a human.
 */

export const LOINC_SYSTEM = "http://loinc.org"

export interface LoincCode {
  code: string
  /** LOINC long common name — the check against a mistyped code. */
  display: string
}

/** Panel codes, keyed by the catalogue's test name. */
export const TEST_LOINC: Record<string, LoincCode | undefined> = {
  "Complete Blood Count (CBC)": {
    code: "58410-2",
    display: "CBC panel - Blood by Automated count",
  },
  "Liver Function Test (LFT)": {
    code: "24325-3",
    display: "Hepatic function 1998 panel - Serum or Plasma",
  },
  "Kidney Function Test (KFT)": {
    code: "24362-6",
    display: "Renal function 2000 panel - Serum or Plasma",
  },
  "Fasting Blood Sugar": {
    code: "1558-6",
    display: "Fasting glucose [Mass/volume] in Serum or Plasma",
  },
  "Lipid Profile": {
    code: "24331-1",
    display: "Lipid 1996 panel - Serum or Plasma",
  },
  "Thyroid Function Test (TFT)": {
    code: "24348-5",
    display: "Thyroid function 2000 panel - Serum or Plasma",
  },
  HbA1c: {
    code: "4548-4",
    display: "Hemoglobin A1c/Hemoglobin.total in Blood",
  },
  Urinalysis: {
    code: "24357-6",
    display: "Urinalysis macro (dipstick) panel - Urine",
  },
  "Electrolyte Panel": {
    code: "24326-1",
    display: "Electrolytes 1998 panel - Serum or Plasma",
  },

  "Widal Test": {
    code: "34372-3",
    display: "Salmonella typhi O Ab [Titer] in Serum by Agglutination",
  },
  "Coagulation Profile (PT/INR)": {
    // A LOINC "PT panel" is exactly PT plus its derived INR, which is what this
    // catalogue entry reports.
    code: "34528-0",
    display: "PT panel - Platelet poor plasma by Coagulation assay",
  },

  // METHOD-DEPENDENT — confirm against the RDT this lab actually stocks.
  // 46094-9 is the species-AGNOSTIC presence code, correct for a combo or
  // pan-Plasmodium test and safe when the kit is unknown. If the lab runs a
  // P. falciparum-only HRP2 test (common in Nigeria), 76772-3 "Plasmodium
  // falciparum Ag [Presence] in Blood by Rapid immunoassay" is the truthful
  // code and this generic one understates what was measured.
  "Malaria Parasite Test": {
    code: "46094-9",
    display: "Plasmodium sp Ag [Presence] in Blood by Immunoassay",
  },
}

/** Analyte codes, keyed by the catalogue's parameter name. */
export const PARAMETER_LOINC: Record<string, LoincCode | undefined> = {
  // Haematology
  Hemoglobin: { code: "718-7", display: "Hemoglobin [Mass/volume] in Blood" },
  "White Blood Cells": {
    code: "6690-2",
    display: "Leukocytes [#/volume] in Blood by Automated count",
  },
  Platelets: { code: "777-3", display: "Platelets [#/volume] in Blood by Automated count" },
  Hematocrit: {
    code: "4544-3",
    display: "Hematocrit [Volume Fraction] of Blood by Automated count",
  },

  // Liver
  ALT: {
    code: "1742-6",
    display: "Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma",
  },
  AST: {
    code: "1920-8",
    display: "Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma",
  },
  "Bilirubin Total": {
    code: "1975-2",
    display: "Bilirubin.total [Mass/volume] in Serum or Plasma",
  },

  // Renal. The catalogue's "Urea" carries a 7-20 mg/dL range, which is the BUN
  // reference interval, not serum urea (roughly 15-40 mg/dL) — so this is urea
  // NITROGEN and is coded as such. Coding it as urea would misreport the value
  // by a factor of about 2.14.
  Urea: { code: "3094-0", display: "Urea nitrogen [Mass/volume] in Serum or Plasma" },
  Creatinine: { code: "2160-0", display: "Creatinine [Mass/volume] in Serum or Plasma" },

  // Glycaemic
  "Glucose (Fasting)": {
    code: "1558-6",
    display: "Fasting glucose [Mass/volume] in Serum or Plasma",
  },
  HbA1c: { code: "4548-4", display: "Hemoglobin A1c/Hemoglobin.total in Blood" },

  // Lipids. LDL here is the CALCULATED (Friedewald) code, which is what a panel
  // reporting total cholesterol, HDL and triglycerides alongside it implies. A
  // lab measuring LDL directly must use 18262-6 instead.
  "Total Cholesterol": { code: "2093-3", display: "Cholesterol [Mass/volume] in Serum or Plasma" },
  LDL: {
    code: "13457-7",
    display: "Cholesterol in LDL [Mass/volume] in Serum or Plasma by calculation",
  },
  HDL: { code: "2085-9", display: "Cholesterol in HDL [Mass/volume] in Serum or Plasma" },
  Triglycerides: { code: "2571-8", display: "Triglyceride [Mass/volume] in Serum or Plasma" },

  // Thyroid
  TSH: { code: "3016-3", display: "Thyrotropin [Units/volume] in Serum or Plasma" },
  "Free T4": { code: "3024-7", display: "Thyroxine (T4) free [Mass/volume] in Serum or Plasma" },

  // Urine dipstick — the qualitative "Presence by Test strip" codes, not the
  // quantitative serum ones. Using the quantitative code for a "Negative"
  // result would claim a measurement that was never made.
  Protein: { code: "20454-5", display: "Protein [Presence] in Urine by Test strip" },
  Glucose: { code: "25428-4", display: "Glucose [Presence] in Urine by Test strip" },

  // Electrolytes
  Sodium: { code: "2951-2", display: "Sodium [Moles/volume] in Serum or Plasma" },
  Potassium: { code: "2823-3", display: "Potassium [Moles/volume] in Serum or Plasma" },

  // Coagulation
  "Prothrombin Time": { code: "5902-2", display: "Prothrombin time (PT)" },
  INR: {
    code: "6301-6",
    display: "INR in Platelet poor plasma by Coagulation assay",
  },

  "S. Typhi O": {
    code: "34372-3",
    display: "Salmonella typhi O Ab [Titer] in Serum by Agglutination",
  },
  // Same method caveat as the panel above.
  "Malaria Antigen": {
    code: "46094-9",
    display: "Plasmodium sp Ag [Presence] in Blood by Immunoassay",
  },
}

/**
 * A FHIR CodeableConcept for a test, or a text-only concept when the test has
 * no confirmed code.
 *
 * `text` is always set, coded or not, so a human reading the resource sees the
 * name the clinician actually ordered rather than a bare number.
 */
export function testConcept(testName: string) {
  const loinc = TEST_LOINC[testName]
  return loinc
    ? { coding: [{ system: LOINC_SYSTEM, code: loinc.code, display: loinc.display }], text: testName }
    : { text: testName }
}

/** As `testConcept`, for one measured analyte. */
export function parameterConcept(parameterName: string) {
  const loinc = PARAMETER_LOINC[parameterName]
  return loinc
    ? {
        coding: [{ system: LOINC_SYSTEM, code: loinc.code, display: loinc.display }],
        text: parameterName,
      }
    : { text: parameterName }
}

/** Codes still needing a lab scientist's confirmation — surfaced, not buried. */
export function uncodedCatalogueEntries(): { tests: string[]; parameters: string[] } {
  return {
    tests: Object.entries(TEST_LOINC)
      .filter(([, value]) => !value)
      .map(([key]) => key),
    parameters: Object.entries(PARAMETER_LOINC)
      .filter(([, value]) => !value)
      .map(([key]) => key),
  }
}
