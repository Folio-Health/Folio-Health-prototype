/**
 * The clerking note (Implementation Manuscript §4.3).
 *
 * §4.3 is the densest part of the encounter and the manuscript says plainly
 * that it is "the part most in need of a structured, not free-text-only,
 * interface". What was here before was four SOAP boxes, which is free text
 * wearing four hats — it cannot be queried, cannot be pre-populated, and
 * cannot later be pulled across facilities, which is what §1 and §4.3 both
 * say the longitudinal fields exist for.
 *
 * So the ten steps below are modelled as fields, in the manuscript's own
 * order, and the UI renders from this structure rather than hard-coding it.
 *
 *   1  Presenting Complaint            presentingComplaint
 *   2  History of Presenting Complaint hpc (5 named sub-fields)
 *   3  Review of Systems               ros (9 body systems)
 *   4  Past Medical History            pastMedicalHistory
 *   5  Social and psychological        socialHistory, psychologicalHistory
 *   6  Drug / medication history       drugHistory
 *   7  Physical exam findings          physicalExam
 *   8  Problem list / differentials    problemList, differentials
 *   9  Management plan                 managementPlan (5 named sub-fields)
 *  10  Orders                          handled by the Orders section
 */

/** §4.3 step 2 — the five things an HPC has to pin down. */
export const HPC_FIELDS = [
  { key: "onset", label: "Onset", placeholder: "When did it start, and how suddenly?" },
  { key: "duration", label: "Duration", placeholder: "How long has it been going on?" },
  {
    key: "character",
    label: "Character / quality",
    placeholder: "Sharp, dull, burning, colicky, radiating?",
  },
  { key: "severity", label: "Severity", placeholder: "How bad is it, and what does it stop them doing?" },
  {
    key: "associatedSymptoms",
    label: "Associated symptoms",
    placeholder: "What else came with it?",
  },
] as const

export type HpcField = (typeof HPC_FIELDS)[number]["key"]

export type HpcDetail = Record<HpcField, string>

/** §4.3 step 3 — one structured section per body system, in the listed order. */
export const ROS_SYSTEMS = [
  { key: "general", label: "General / constitutional", hint: "Fever, weight change, appetite, fatigue" },
  { key: "cardiovascular", label: "Cardiovascular", hint: "Chest pain, palpitations, orthopnoea, oedema" },
  { key: "respiratory", label: "Respiratory", hint: "Cough, sputum, breathlessness, wheeze" },
  { key: "gastrointestinal", label: "Gastrointestinal", hint: "Nausea, vomiting, bowel habit, abdominal pain" },
  { key: "urinary", label: "Urinary", hint: "Frequency, dysuria, haematuria, incontinence" },
  { key: "neurological", label: "Neurological", hint: "Headache, fits, weakness, sensory change" },
  { key: "musculoskeletal", label: "Musculoskeletal", hint: "Joint pain, swelling, stiffness, mobility" },
  { key: "endocrine", label: "Endocrine", hint: "Polyuria, polydipsia, heat or cold intolerance" },
  { key: "skin", label: "Skin", hint: "Rash, itching, lesions, colour change" },
] as const

export type RosSystem = (typeof ROS_SYSTEMS)[number]["key"]

export interface RosEntry {
  /** Ticked when the system was reviewed and nothing abnormal was found. */
  noAbnormality: boolean
  notes: string
}

/** §4.3 step 9 — the management plan splits along these five axes. */
export const MANAGEMENT_FIELDS = [
  { key: "immediate", label: "Immediate", placeholder: "What happens now, before the patient leaves this room?" },
  { key: "subsequent", label: "Subsequent", placeholder: "Follow-up, review interval, referral" },
  { key: "medical", label: "Medical treatment", placeholder: "Drug treatment and non-surgical management" },
  { key: "supportive", label: "Supportive treatment", placeholder: "Fluids, analgesia, nutrition, nursing care" },
  { key: "prevention", label: "Prevention", placeholder: "Counselling, vaccination, risk-factor modification" },
] as const

export type ManagementField = (typeof MANAGEMENT_FIELDS)[number]["key"]

export type ManagementPlan = Record<ManagementField, string>

export interface ClerkingNote {
  presentingComplaint: string
  hpc: HpcDetail
  ros: Record<RosSystem, RosEntry>
  pastMedicalHistory: string
  socialHistory: string
  psychologicalHistory: string
  drugHistory: string
  physicalExam: string
  problemList: string
  differentials: string
  managementPlan: ManagementPlan
}

export function emptyClerkingNote(): ClerkingNote {
  return {
    presentingComplaint: "",
    hpc: HPC_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {} as HpcDetail),
    ros: ROS_SYSTEMS.reduce(
      (acc, s) => ({ ...acc, [s.key]: { noAbnormality: false, notes: "" } }),
      {} as Record<RosSystem, RosEntry>
    ),
    pastMedicalHistory: "",
    socialHistory: "",
    psychologicalHistory: "",
    drugHistory: "",
    physicalExam: "",
    problemList: "",
    differentials: "",
    managementPlan: MANAGEMENT_FIELDS.reduce(
      (acc, f) => ({ ...acc, [f.key]: "" }),
      {} as ManagementPlan
    ),
  }
}

/**
 * The steps of §4.3, and whether each has been started.
 *
 * Drives the progress indicator: a clerking interface that shows ten steps
 * without showing which are done is a checklist you have to hold in your head.
 */
export const CLERKING_STEPS = [
  { key: "pc", label: "Presenting complaint" },
  { key: "hpc", label: "History of presenting complaint" },
  { key: "ros", label: "Review of systems" },
  { key: "pmhx", label: "Past medical history" },
  { key: "social", label: "Social and psychological" },
  { key: "drugs", label: "Drug history" },
  { key: "exam", label: "Physical examination" },
  { key: "problems", label: "Problem list and differentials" },
  { key: "plan", label: "Management plan" },
] as const

export type ClerkingStepKey = (typeof CLERKING_STEPS)[number]["key"]

const filled = (value: string) => value.trim().length > 0

export function completedSteps(note: ClerkingNote): Set<ClerkingStepKey> {
  const done = new Set<ClerkingStepKey>()

  if (filled(note.presentingComplaint)) done.add("pc")
  if (HPC_FIELDS.some((f) => filled(note.hpc[f.key]))) done.add("hpc")
  if (ROS_SYSTEMS.some((s) => note.ros[s.key].noAbnormality || filled(note.ros[s.key].notes))) {
    done.add("ros")
  }
  if (filled(note.pastMedicalHistory)) done.add("pmhx")
  if (filled(note.socialHistory) || filled(note.psychologicalHistory)) done.add("social")
  if (filled(note.drugHistory)) done.add("drugs")
  if (filled(note.physicalExam)) done.add("exam")
  if (filled(note.problemList) || filled(note.differentials)) done.add("problems")
  if (MANAGEMENT_FIELDS.some((f) => filled(note.managementPlan[f.key]))) done.add("plan")

  return done
}

/** How many ROS systems have been addressed either way, for the section header. */
export function rosReviewedCount(note: ClerkingNote): number {
  return ROS_SYSTEMS.filter(
    (s) => note.ros[s.key].noAbnormality || filled(note.ros[s.key].notes)
  ).length
}
