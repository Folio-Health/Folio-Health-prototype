import { faker } from "@faker-js/faker"
import { subHours } from "date-fns"
import { seedFaker, pick, pickWeighted, id } from "./seed"
import { PATIENTS } from "./patients"
import { DOCTORS, getStaffByRole } from "./staff"

seedFaker(6)

const LAB_SCIENTISTS = getStaffByRole("Lab Scientist")

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

function round(value: number, decimals: number) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function generateParameter(def: ParamDef, driverFlag: ResultFlag): ResultParameter {
  if (def.kind === "numeric") {
    const decimals = def.high - def.low < 5 ? 1 : 0
    let value: number
    if (driverFlag === "Normal") {
      value = faker.number.float({ min: def.low, max: def.high })
    } else if (driverFlag === "Abnormal") {
      const span = (def.high - def.low) * 0.35 || def.high * 0.35 || 1
      value = faker.datatype.boolean()
        ? def.high + faker.number.float({ min: 0.5, max: Math.max(span, 0.55) })
        : Math.max(0, def.low - faker.number.float({ min: 0.2, max: Math.max(span, 0.25) }))
    } else {
      const span = (def.high - def.low) * 0.9 || def.high * 0.9 || 2
      value = faker.datatype.boolean()
        ? def.high + faker.number.float({ min: span, max: span * 1.8 })
        : Math.max(0, def.low - faker.number.float({ min: span * 0.6, max: span }))
    }
    value = round(value, decimals)
    const flag: ResultFlag = value < def.low || value > def.high ? driverFlag : "Normal"
    return {
      parameter: def.parameter,
      unit: def.unit,
      referenceRange: `${def.low} - ${def.high}${def.unit ? ` ${def.unit}` : ""}`,
      result: `${value}${def.unit ? ` ${def.unit}` : ""}`,
      flag,
    }
  }

  const value = driverFlag === "Normal" ? def.normalValue : pick(def.abnormalValues)
  return {
    parameter: def.parameter,
    unit: def.unit,
    referenceRange: def.normalValue,
    result: value,
    flag: value === def.normalValue ? "Normal" : driverFlag,
  }
}

function generateParameters(test: TestDefinition, flag: ResultFlag): ResultParameter[] {
  if (flag === "Normal") {
    return test.parameters.map((def) => generateParameter(def, "Normal"))
  }
  const driverIndex = faker.number.int({ min: 0, max: test.parameters.length - 1 })
  return test.parameters.map((def, i) => generateParameter(def, i === driverIndex ? flag : "Normal"))
}

function summarize(parameters: ResultParameter[]) {
  const first = parameters[0]
  const more = parameters.length - 1
  return {
    resultSummary: more > 0 ? `${first.result} (+${more} more)` : first.result,
    referenceRangeSummary: first.referenceRange,
  }
}

function buildResults(count: number): LabResult[] {
  const results: LabResult[] = []

  for (let i = 1; i <= count; i++) {
    const test = pick(TEST_CATALOG)
    const patient = pick(PATIENTS)
    const doctor = pick(DOCTORS)
    const scientist = pick(LAB_SCIENTISTS)
    const workflowStatus = pickWeighted<LabWorkflowStatus>([
      { value: "Pending", weight: 15 },
      { value: "In Progress", weight: 15 },
      { value: "Completed", weight: 38 },
      { value: "Approved", weight: 32 },
    ])
    const orderedAt = subHours(new Date(), faker.number.int({ min: 4, max: 24 * 21 })).toISOString()
    const isCollected = workflowStatus !== "Pending"
    const isResulted = workflowStatus === "Completed" || workflowStatus === "Approved"

    let parameters: ResultParameter[] = []
    let flag: ResultFlag | null = null
    let collectedAt: string | null = null
    let resultAt: string | null = null
    let approvedAt: string | null = null

    if (isCollected) {
      collectedAt = subHours(new Date(orderedAt), -faker.number.int({ min: 1, max: 6 })).toISOString()
    }

    if (isResulted) {
      flag = pickWeighted<ResultFlag>([
        { value: "Normal", weight: 60 },
        { value: "Abnormal", weight: 28 },
        { value: "Critical", weight: 12 },
      ])
      parameters = generateParameters(test, flag)
      resultAt = faker.date
        .between({ from: collectedAt ?? orderedAt, to: new Date() })
        .toISOString()
      if (workflowStatus === "Approved") {
        approvedAt = faker.date.between({ from: resultAt, to: new Date() }).toISOString()
      }
    }

    const { resultSummary, referenceRangeSummary } = parameters.length
      ? summarize(parameters)
      : { resultSummary: "N/A", referenceRangeSummary: "N/A" }

    results.push({
      id: id("LAB", i),
      patientId: patient.id,
      doctorId: doctor.id,
      labScientistId: scientist?.id ?? doctor.id,
      testType: test.category,
      testName: test.name,
      parameters,
      resultSummary,
      referenceRangeSummary,
      flag,
      workflowStatus,
      displayStatus: flag ?? workflowStatus,
      orderedAt,
      collectedBy: isCollected ? (scientist?.id ?? null) : null,
      collectedAt,
      resultAt,
      approvedAt,
      approvedBy: approvedAt ? (pick(LAB_SCIENTISTS)?.name ?? "Lab Supervisor") : null,
      comments:
        flag === "Critical"
          ? "Critical value called to attending physician. Recommend clinical correlation and repeat testing."
          : flag === "Abnormal"
            ? "Mildly outside reference range. Recommend clinical correlation."
            : flag === "Normal"
              ? "All parameters within normal limits."
              : "",
    })
  }

  return results.sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime())
}

function buildOrders(count: number): LabOrder[] {
  const orders: LabOrder[] = []
  for (let i = 1; i <= count; i++) {
    const patient = pick(PATIENTS)
    const doctor = pick(DOCTORS)
    const testCount = faker.number.int({ min: 1, max: 3 })
    const tests = faker.helpers.arrayElements(TEST_NAMES, testCount)
    orders.push({
      id: id("ORD", i),
      patientId: patient.id,
      doctorId: doctor.id,
      tests,
      orderedAt: subHours(new Date(), faker.number.int({ min: 1, max: 24 * 5 })).toISOString(),
      status: pickWeighted<LabOrderStatus>([
        { value: "Pending Collection", weight: 55 },
        { value: "Collected", weight: 38 },
        { value: "Cancelled", weight: 7 },
      ]),
      priority: pickWeighted<LabPriority>([
        { value: "Routine", weight: 65 },
        { value: "Urgent", weight: 25 },
        { value: "STAT", weight: 10 },
      ]),
    })
  }
  return orders.sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime())
}

export const LAB_RESULTS: LabResult[] = buildResults(38)
export const LAB_ORDERS: LabOrder[] = buildOrders(24)

export function getLabResultById(resultId: string): LabResult | undefined {
  return LAB_RESULTS.find((r) => r.id === resultId)
}

export function getLabOrderById(orderId: string): LabOrder | undefined {
  return LAB_ORDERS.find((o) => o.id === orderId)
}
