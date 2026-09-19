// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
export type ResultFlag = "Normal" | "Abnormal" | "Critical"
export type LabWorkflowStatus = "Pending" | "In Progress" | "Completed" | "Approved"
export type LabOrderStatus = "Pending Collection" | "Collected" | "Cancelled"
export type LabPriority = "Routine" | "Urgent" | "STAT"

interface NumericParamDef {
  kind: "numeric"
  parameter: string
  unit: string
  low: number
  high: number
}

interface QualitativeParamDef {
  kind: "qualitative"
  parameter: string
  unit: string
  normalValue: string
  abnormalValues: string[]
}

type ParamDef = NumericParamDef | QualitativeParamDef

interface TestDefinition {
  name: string
  category: string
  parameters: ParamDef[]
}

export interface ResultParameter {
  parameter: string
  unit: string
  referenceRange: string
  result: string
  flag: ResultFlag
}

export interface LabResult {
  id: string
  patientId: string
  doctorId: string
  labScientistId: string
  testType: string
  testName: string
  parameters: ResultParameter[]
  resultSummary: string
  referenceRangeSummary: string
  flag: ResultFlag | null
  workflowStatus: LabWorkflowStatus
  displayStatus: string
  orderedAt: string
  collectedBy: string | null
  collectedAt: string | null
  resultAt: string | null
  approvedAt: string | null
  approvedBy: string | null
  comments: string
}

export interface LabOrder {
  id: string
  patientId: string
  doctorId: string
  tests: string[]
  orderedAt: string
  status: LabOrderStatus
  priority: LabPriority
}

const TEST_CATALOG: TestDefinition[] = [
  {
    name: "Complete Blood Count (CBC)",
    category: "Hematology",
    parameters: [
      { kind: "numeric", parameter: "Hemoglobin", unit: "g/dL", low: 12, high: 16 },
      { kind: "numeric", parameter: "White Blood Cells", unit: "x10³/µL", low: 4, high: 11 },
      { kind: "numeric", parameter: "Platelets", unit: "x10³/µL", low: 150, high: 450 },
      { kind: "numeric", parameter: "Hematocrit", unit: "%", low: 36, high: 46 },
    ],
  },
  {
    name: "Liver Function Test (LFT)",
    category: "Biochemistry",
    parameters: [
      { kind: "numeric", parameter: "ALT", unit: "U/L", low: 7, high: 56 },
      { kind: "numeric", parameter: "AST", unit: "U/L", low: 10, high: 40 },
      { kind: "numeric", parameter: "Bilirubin Total", unit: "mg/dL", low: 0.1, high: 1.2 },
    ],
  },
  {
    name: "Kidney Function Test (KFT)",
    category: "Biochemistry",
    parameters: [
      { kind: "numeric", parameter: "Urea", unit: "mg/dL", low: 7, high: 20 },
      { kind: "numeric", parameter: "Creatinine", unit: "mg/dL", low: 0.6, high: 1.3 },
    ],
  },
  {
    name: "Fasting Blood Sugar",
    category: "Biochemistry",
    parameters: [{ kind: "numeric", parameter: "Glucose (Fasting)", unit: "mg/dL", low: 70, high: 100 }],
  },
  {
    name: "Lipid Profile",
    category: "Biochemistry",
    parameters: [
      { kind: "numeric", parameter: "Total Cholesterol", unit: "mg/dL", low: 125, high: 200 },
      { kind: "numeric", parameter: "LDL", unit: "mg/dL", low: 0, high: 100 },
      { kind: "numeric", parameter: "HDL", unit: "mg/dL", low: 40, high: 60 },
      { kind: "numeric", parameter: "Triglycerides", unit: "mg/dL", low: 0, high: 150 },
    ],
  },
  {
    name: "Thyroid Function Test (TFT)",
    category: "Endocrinology",
    parameters: [
      { kind: "numeric", parameter: "TSH", unit: "µIU/mL", low: 0.4, high: 4 },
      { kind: "numeric", parameter: "Free T4", unit: "ng/dL", low: 0.8, high: 1.8 },
    ],
  },
  {
    name: "HbA1c",
    category: "Biochemistry",
    parameters: [{ kind: "numeric", parameter: "HbA1c", unit: "%", low: 4, high: 5.6 }],
  },
  {
    name: "Urinalysis",
    category: "Microbiology",
    parameters: [
      { kind: "qualitative", parameter: "Protein", unit: "", normalValue: "Negative", abnormalValues: ["Trace", "1+"] },
      { kind: "qualitative", parameter: "Glucose", unit: "", normalValue: "Negative", abnormalValues: ["Trace", "2+"] },
    ],
  },
  {
    name: "Malaria Parasite Test",
    category: "Microbiology",
    parameters: [
      { kind: "qualitative", parameter: "Malaria Antigen", unit: "", normalValue: "Negative", abnormalValues: ["Positive"] },
    ],
  },
  {
    name: "Widal Test",
    category: "Microbiology",
    parameters: [
      { kind: "numeric", parameter: "S. Typhi O", unit: "titre", low: 0, high: 80 },
    ],
  },
  {
    name: "Coagulation Profile (PT/INR)",
    category: "Hematology",
    parameters: [
      { kind: "numeric", parameter: "Prothrombin Time", unit: "sec", low: 11, high: 13.5 },
      { kind: "numeric", parameter: "INR", unit: "", low: 0.8, high: 1.1 },
    ],
  },
  {
    name: "Electrolyte Panel",
    category: "Biochemistry",
    parameters: [
      { kind: "numeric", parameter: "Sodium", unit: "mmol/L", low: 135, high: 145 },
      { kind: "numeric", parameter: "Potassium", unit: "mmol/L", low: 3.5, high: 5.1 },
    ],
  },
]

export const TEST_TYPES = Array.from(new Set(TEST_CATALOG.map((t) => t.category)))
export const TEST_NAMES = TEST_CATALOG.map((t) => t.name)
export const TEST_CATEGORY_BY_NAME: Record<string, string> = Object.fromEntries(
  TEST_CATALOG.map((t) => [t.name, t.category])
)

export const LAB_RESULTS: LabResult[] = []
export const LAB_ORDERS: LabOrder[] = []

export function getLabResultById(resultId: string): LabResult | undefined {
  return LAB_RESULTS.find((r) => r.id === resultId)
}

export function getLabOrderById(orderId: string): LabOrder | undefined {
  return LAB_ORDERS.find((o) => o.id === orderId)
}
