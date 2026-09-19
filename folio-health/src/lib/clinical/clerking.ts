import type { Composition } from "@medplum/fhirtypes"

/**
 * The clerking note — the standard Nigerian clinical clerking sequence, as
 * a structured document:
 *
 *   Presenting complaints → History of presenting complaint → Review of
 *   systems → Past medical history → Drug history & allergies → Family
 *   history → Social/personal history → (Obstetric & gynaecological history)
 *   → (Paediatric history) → Summary → Provisional diagnosis → Differentials
 *   → Examination → Investigations → Management plan
 *
 * Consent and biodata are not note sections: consent is confirmed at the
 * start of the consultation (a checkbox on the workspace), and biodata is
 * the registered Patient record shown in the banner.
 *
 * Stored as a FHIR `Composition` (one section per heading, narrative text)
 * — `preliminary` while the doctor is drafting, `final` once SIGNED, after
 * which the server refuses further edits: a signed note is immutable, and
 * corrections are addenda (docs/research/emr-clinical-flows.md §1).
 */

export const CLERKING_SYSTEM = "https://folio.health/fhir/CodeSystem/clerking-section"
export const CLERKING_NOTE_LOINC = "11488-4" // Consult note

export interface ClerkingSectionDef {
  key: string
  title: string
  hint: string
  /** Shown only when the doctor opens it (obstetric, paediatric). */
  optional?: boolean
  /** Presenting complaints are a symptom/duration list, not free text. */
  structured?: "complaints"
}

export const CLERKING_SECTIONS: ClerkingSectionDef[] = [
  {
    key: "presentingComplaints",
    title: "Presenting complaints",
    hint: "Main symptoms in chronological order, each with its duration.",
    structured: "complaints",
  },
  {
    key: "hpc",
    title: "History of presenting complaint",
    hint: "Onset, duration, progression, severity, associated symptoms, aggravating/relieving factors, previous episodes, treatment so far.",
  },
  {
    key: "ros",
    title: "Review of systems",
    hint: "General, cardiovascular, respiratory, gastrointestinal, genitourinary, neurological, musculoskeletal, endocrine, skin — as relevant.",
  },
  {
    key: "pmh",
    title: "Past medical history",
    hint: "Previous illnesses, admissions, operations, transfusions, chronic disease; ask specifically about hypertension, diabetes, TB, asthma, sickle-cell disease.",
  },
  {
    key: "drugHistory",
    title: "Drug history & allergies",
    hint: "Current and previous medications (prescribed, over-the-counter, herbal/traditional), drug allergies and reactions, adherence.",
  },
  {
    key: "familyHistory",
    title: "Family history",
    hint: "Similar illness; hereditary disease; hypertension, diabetes, sickle-cell, psychiatric illness, cancers; relevant deaths and causes.",
  },
  {
    key: "socialHistory",
    title: "Social / personal history",
    hint: "Occupation and exposures, smoking, alcohol, recreational drugs, diet, living conditions, sexual history where relevant, travel; water/sanitation, malaria and TB exposure.",
  },
  {
    key: "obstetricHistory",
    title: "Obstetric & gynaecological history",
    hint: "Menstrual history, obstetric history (G/P and outcomes), contraception, gynaecological conditions.",
    optional: true,
  },
  {
    key: "paediatricHistory",
    title: "Paediatric history",
    hint: "Antenatal/perinatal/neonatal history, immunisation, feeding/nutrition, developmental milestones, previous illnesses/admissions.",
    optional: true,
  },
  {
    key: "summary",
    title: "Summary",
    hint: "Concise summary of the important positive and negative findings, key history, risk factors.",
  },
  {
    key: "provisionalDiagnosis",
    title: "Provisional diagnosis",
    hint: "The most likely diagnosis.",
  },
  {
    key: "differentials",
    title: "Differential diagnoses",
    hint: "Relevant differentials, briefly justified.",
  },
  {
    key: "examination",
    title: "Examination",
    hint: "General examination (vital signs are recorded above), then the relevant systemic examination.",
  },
  {
    key: "investigations",
    title: "Investigations",
    hint: "Bedside, laboratory and imaging investigations to confirm the diagnosis, assess severity, identify complications, establish a baseline. Place the orders in the Orders panel.",
  },
  {
    key: "managementPlan",
    title: "Management plan",
    hint: "Immediate/stabilisation measures, definitive treatment, supportive treatment, prevention of complications, patient education and follow-up. Prescriptions go in the Prescriptions panel.",
  },
]

export interface PresentingComplaint {
  symptom: string
  duration: string
}

export interface ClerkingNote {
  complaints: PresentingComplaint[]
  sections: Record<string, string>
}

export function emptyClerkingNote(): ClerkingNote {
  return { complaints: [{ symptom: "", duration: "" }], sections: {} }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function narrative(text: string): { status: "generated"; div: string } {
  const lines = text.split(/\r?\n/).map((l) => escapeHtml(l))
  return {
    status: "generated",
    div: `<div xmlns="http://www.w3.org/1999/xhtml">${lines.map((l) => `<p>${l || "&#160;"}</p>`).join("")}</div>`,
  }
}

function fromNarrative(div: string | undefined): string {
  if (!div) return ""
  return div
    .replace(/<\/p>\s*<p[^>]*>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#160;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim()
}

const COMPLAINT_SEPARATOR = " – "

/** The Composition sections for a note (only headings with content). */
export function toCompositionSections(note: ClerkingNote): NonNullable<Composition["section"]> {
  const sections: NonNullable<Composition["section"]> = []
  for (const def of CLERKING_SECTIONS) {
    let text: string
    if (def.structured === "complaints") {
      text = note.complaints
        .filter((c) => c.symptom.trim())
        .map((c) => `${c.symptom.trim()}${c.duration.trim() ? COMPLAINT_SEPARATOR + c.duration.trim() : ""}`)
        .join("\n")
    } else {
      text = (note.sections[def.key] ?? "").trim()
    }
    if (!text) continue
    sections.push({
      title: def.title,
      code: { coding: [{ system: CLERKING_SYSTEM, code: def.key, display: def.title }] },
      text: narrative(text),
    })
  }
  return sections
}

/** Read a note back out of a Composition. */
export function fromComposition(composition: Composition | undefined): ClerkingNote {
  const note = emptyClerkingNote()
  if (!composition?.section) return note
  for (const section of composition.section) {
    const key = section.code?.coding?.find((c) => c.system === CLERKING_SYSTEM)?.code
    if (!key) continue
    const text = fromNarrative(section.text?.div)
    if (key === "presentingComplaints") {
      const rows = text
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const idx = line.indexOf(COMPLAINT_SEPARATOR)
          return idx === -1
            ? { symptom: line, duration: "" }
            : { symptom: line.slice(0, idx), duration: line.slice(idx + COMPLAINT_SEPARATOR.length) }
        })
      note.complaints = rows.length ? rows : note.complaints
    } else {
      note.sections[key] = text
    }
  }
  return note
}

/** True when a note has enough to be signed: at least one complaint and a diagnosis. */
export function noteReadyToSign(note: ClerkingNote): string | null {
  if (!note.complaints.some((c) => c.symptom.trim())) return "Record at least one presenting complaint."
  if (!(note.sections.provisionalDiagnosis ?? "").trim()) return "A provisional diagnosis is required to sign."
  if (!(note.sections.managementPlan ?? "").trim()) return "A management plan is required to sign."
  return null
}
