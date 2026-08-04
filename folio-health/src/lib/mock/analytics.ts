import { faker } from "@faker-js/faker"
import { seedFaker, pick, id } from "./seed"
import { PATIENTS } from "./patients"
import { formatNaira } from "./billing"
import type { Department } from "@/types/core"

seedFaker(60)

const NOW = new Date()

/** Rolling window of the last `n` months (short labels), ending at the current month. */
function lastMonths(n: number): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(NOW.getFullYear(), NOW.getMonth() - i, 1)
    out.push(d.toLocaleString("en-US", { month: "short" }))
  }
  return out
}

const MONTH_LABELS = lastMonths(12)

const CLINICAL_DEPARTMENTS: Department[] = [
  "General Medicine",
  "Cardiology",
  "Pediatrics",
  "Obstetrics & Gynecology",
  "Orthopedics",
  "Neurology",
  "Oncology",
  "Emergency Medicine",
]

/* ------------------------------------------------------------------ */
/* Revenue Dashboard                                                   */
/* ------------------------------------------------------------------ */

export interface MonthlyRevenuePoint {
  month: string
  revenue: number
  [key: string]: string | number
}

/** Monthly revenue in ₦ millions, last 12 months, gently trending up with noise. */
export const MONTHLY_REVENUE: MonthlyRevenuePoint[] = (() => {
  let base = 92
  return MONTH_LABELS.map((month) => {
    base += faker.number.float({ min: -4, max: 9, fractionDigits: 1 })
    base = Math.max(base, 60)
    return { month, revenue: Math.round(base * 10) / 10 }
  })
})()

export interface DepartmentRevenue {
  department: string
  /** ₦ millions, matching the MONTHLY_REVENUE unit so both charts share one axis formatter. */
  revenue: number
  [key: string]: string | number
}

export const REVENUE_BY_DEPARTMENT: DepartmentRevenue[] = CLINICAL_DEPARTMENTS.map((department) => ({
  department,
  revenue: faker.number.float({ min: 8.4, max: 62, fractionDigits: 1 }),
})).sort((a, b) => b.revenue - a.revenue)

const totalRevenueMTD = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].revenue * 1_000_000
const revenueYTD = MONTHLY_REVENUE.reduce((sum, m) => sum + m.revenue, 0) * 1_000_000
const prevMonthRevenue = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 2].revenue

export const REVENUE_STATS = {
  totalRevenueMTD,
  totalRevenueMTDLabel: formatNaira(Math.round(totalRevenueMTD)),
  revenueYTD,
  revenueYTDLabel: formatNaira(Math.round(revenueYTD)),
  avgRevenuePerPatient: Math.round(revenueYTD / PATIENTS.length),
  avgRevenuePerPatientLabel: formatNaira(Math.round(revenueYTD / PATIENTS.length)),
  growthPercent:
    Math.round(
      ((MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].revenue - prevMonthRevenue) / prevMonthRevenue) * 1000
    ) / 10,
}

/* ------------------------------------------------------------------ */
/* Admissions Analytics                                                */
/* ------------------------------------------------------------------ */

export interface MonthlyAdmissionsPoint {
  month: string
  admissions: number
  [key: string]: string | number
}

export const MONTHLY_ADMISSIONS: MonthlyAdmissionsPoint[] = (() => {
  let base = 210
  return MONTH_LABELS.map((month) => {
    base += faker.number.int({ min: -18, max: 24 })
    base = Math.max(base, 140)
    return { month, admissions: base }
  })
})()

export const ADMISSIONS_BY_DEPARTMENT = CLINICAL_DEPARTMENTS.map((label) => ({
  label,
  value: faker.number.int({ min: 40, max: 260 }),
})).sort((a, b) => b.value - a.value)

const totalAdmissions = MONTHLY_ADMISSIONS.reduce((sum, m) => sum + m.admissions, 0)

export const ADMISSIONS_STATS = {
  totalAdmissions,
  avgLengthOfStay: 4.6,
  readmissionRate: 7.8,
  bedOccupancy: 76,
}

/* ------------------------------------------------------------------ */
/* Disease / Diagnosis Trends                                          */
/* ------------------------------------------------------------------ */

const DIAGNOSES = [
  "Hypertension",
  "Type 2 Diabetes",
  "Malaria",
  "Upper Respiratory Infection",
  "Urinary Tract Infection",
  "Osteoarthritis",
  "Asthma",
  "Gastroenteritis",
  "Anemia",
  "Chronic Kidney Disease",
] as const

export interface DiagnosisFrequency {
  diagnosis: string
  cases: number
  [key: string]: string | number
}

export const TOP_DIAGNOSES: DiagnosisFrequency[] = DIAGNOSES.map((diagnosis, i) => ({
  diagnosis,
  cases: faker.number.int({ min: 420 - i * 28, max: 520 - i * 28 }),
})).sort((a, b) => b.cases - a.cases)

const TREND_CONDITIONS = ["Hypertension", "Type 2 Diabetes", "Malaria", "Respiratory Infection"] as const

export const CONDITION_TREND_SERIES = TREND_CONDITIONS.map((label, i) => ({
  key: `condition${i}`,
  label,
  color: `var(--chart-${i + 1})`,
}))

export const CONDITION_MONTHLY_TREND: Record<string, string | number>[] = (() => {
  const bases = [58, 44, 30, 50]
  return MONTH_LABELS.map((month, monthIndex) => {
    const row: Record<string, string | number> = { month }
    TREND_CONDITIONS.forEach((_, i) => {
      // Malaria (index 2) has a rainy-season bump mid-year.
      const seasonal = i === 2 ? Math.round(18 * Math.sin(((monthIndex + 3) / 12) * Math.PI * 2)) : 0
      const wobble = faker.number.int({ min: -6, max: 6 })
      row[`condition${i}`] = Math.max(bases[i] + seasonal + wobble, 8)
    })
    return row
  })
})()

/* ------------------------------------------------------------------ */
/* Department Performance                                              */
/* ------------------------------------------------------------------ */

export interface DepartmentPerformanceRow {
  department: string
  patientsSeen: number
  revenue: number
  avgWaitTimeMinutes: number
  satisfactionScore: number
  [key: string]: string | number
}

export const DEPARTMENT_PERFORMANCE: DepartmentPerformanceRow[] = CLINICAL_DEPARTMENTS.map((department) => ({
  department,
  patientsSeen: faker.number.int({ min: 90, max: 320 }),
  revenue: faker.number.int({ min: 9_000_000, max: 58_000_000 }),
  avgWaitTimeMinutes: faker.number.int({ min: 8, max: 46 }),
  satisfactionScore: faker.number.float({ min: 3.6, max: 4.9, fractionDigits: 1 }),
})).sort((a, b) => b.patientsSeen - a.patientsSeen)

/* ------------------------------------------------------------------ */
/* Patient Statistics — derived from the real PATIENTS array           */
/* ------------------------------------------------------------------ */

const AGE_GROUPS: { group: string; min: number; max: number }[] = [
  { group: "0-12", min: 0, max: 12 },
  { group: "13-19", min: 13, max: 19 },
  { group: "20-39", min: 20, max: 39 },
  { group: "40-59", min: 40, max: 59 },
  { group: "60+", min: 60, max: 200 },
]

export const AGE_GROUP_DISTRIBUTION = AGE_GROUPS.map(({ group, min, max }) => ({
  ageGroup: group,
  count: PATIENTS.filter((p) => p.age >= min && p.age <= max).length,
}))

const maleCount = PATIENTS.filter((p) => p.gender === "Male").length
const femaleCount = PATIENTS.filter((p) => p.gender === "Female").length
const otherCount = PATIENTS.length - maleCount - femaleCount

export const GENDER_DISTRIBUTION = [
  { label: "Male", value: maleCount },
  { label: "Female", value: femaleCount },
  ...(otherCount > 0 ? [{ label: "Other", value: otherCount }] : []),
]

const newThisMonth = PATIENTS.filter((p) => {
  const d = new Date(p.registeredAt)
  return d.getFullYear() === NOW.getFullYear() && d.getMonth() === NOW.getMonth()
}).length

export const PATIENT_STATS = {
  totalPatients: PATIENTS.length,
  newThisMonth: Math.max(newThisMonth, 6),
  avgAge: Math.round(PATIENTS.reduce((sum, p) => sum + p.age, 0) / PATIENTS.length),
  genderRatioLabel: `${maleCount}:${femaleCount}`,
}

/* ------------------------------------------------------------------ */
/* Financial Reports                                                   */
/* ------------------------------------------------------------------ */

export const REVENUE_VS_EXPENSES: { month: string; revenue: number; expenses: number }[] = MONTHLY_REVENUE.map(
  (m) => ({
    month: m.month,
    revenue: m.revenue,
    expenses: Math.round(m.revenue * faker.number.float({ min: 0.58, max: 0.74, fractionDigits: 2 }) * 10) / 10,
  })
)

const ytdExpenses = REVENUE_VS_EXPENSES.reduce((sum, m) => sum + m.expenses, 0)

export const FINANCIAL_STATS = {
  totalRevenueYTDLabel: REVENUE_STATS.revenueYTDLabel,
  totalExpensesYTDLabel: formatNaira(Math.round(ytdExpenses * 1_000_000)),
  netMarginPercent: Math.round(((revenueYTD / 1_000_000 - ytdExpenses) / (revenueYTD / 1_000_000)) * 1000) / 10,
  outstandingReceivablesLabel: formatNaira(faker.number.int({ min: 4_200_000, max: 12_800_000 })),
}

export interface ReportLineItem {
  id: string
  name: string
  period: string
  generatedAt: string
  type: "Financial" | "Clinical"
}

const FINANCIAL_REPORT_NAMES = [
  "Monthly Revenue Summary",
  "Departmental P&L Statement",
  "Accounts Receivable Aging",
  "Insurance Claims Reconciliation",
  "Cash Flow Statement",
  "Expense Breakdown Report",
  "Payer Mix Analysis",
]

export const FINANCIAL_REPORTS: ReportLineItem[] = FINANCIAL_REPORT_NAMES.map((name, i) => ({
  id: id("FRPT", i + 1),
  name,
  period: pick(["Jun 2026", "Q2 2026", "May 2026", "FY 2025", "Jul 2026"]),
  generatedAt: faker.date.recent({ days: 45 }).toISOString(),
  type: "Financial" as const,
}))

/* ------------------------------------------------------------------ */
/* Clinical Reports                                                    */
/* ------------------------------------------------------------------ */

export const CLINICAL_STATS = {
  avgLengthOfStay: ADMISSIONS_STATS.avgLengthOfStay,
  mortalityRate: 1.4,
  infectionRate: 2.1,
  patientSatisfaction: 4.4,
}

const CLINICAL_REPORT_NAMES = [
  "Hospital Acquired Infection Summary",
  "Mortality & Morbidity Review",
  "Readmission Rate Analysis",
  "Patient Satisfaction Survey Results",
  "Clinical Outcomes by Department",
  "Length of Stay Distribution",
]

export const CLINICAL_REPORTS: ReportLineItem[] = CLINICAL_REPORT_NAMES.map((name, i) => ({
  id: id("CRPT", i + 1),
  name,
  period: pick(["Jun 2026", "Q2 2026", "May 2026", "FY 2025", "Jul 2026"]),
  generatedAt: faker.date.recent({ days: 60 }).toISOString(),
  type: "Clinical" as const,
}))
