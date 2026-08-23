// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import { formatNaira } from "./billing"

/* ------------------------------------------------------------------ */
/* Revenue Dashboard                                                   */
/* ------------------------------------------------------------------ */

export interface MonthlyRevenuePoint {
  month: string
  revenue: number
  [key: string]: string | number
}

export const MONTHLY_REVENUE: MonthlyRevenuePoint[] = []

export interface DepartmentRevenue {
  department: string
  /** ₦ millions, matching the MONTHLY_REVENUE unit so both charts share one axis formatter. */
  revenue: number
  [key: string]: string | number
}

export const REVENUE_BY_DEPARTMENT: DepartmentRevenue[] = []

export const REVENUE_STATS = {
  totalRevenueMTD: 0,
  totalRevenueMTDLabel: formatNaira(0),
  revenueYTD: 0,
  revenueYTDLabel: formatNaira(0),
  avgRevenuePerPatient: 0,
  avgRevenuePerPatientLabel: formatNaira(0),
  growthPercent: 0,
}

/* ------------------------------------------------------------------ */
/* Admissions Analytics                                                */
/* ------------------------------------------------------------------ */

export interface MonthlyAdmissionsPoint {
  month: string
  admissions: number
  [key: string]: string | number
}

export const MONTHLY_ADMISSIONS: MonthlyAdmissionsPoint[] = []

export const ADMISSIONS_BY_DEPARTMENT: { label: string; value: number }[] = []

export const ADMISSIONS_STATS = {
  totalAdmissions: 0,
  avgLengthOfStay: 0,
  readmissionRate: 0,
  bedOccupancy: 0,
}

/* ------------------------------------------------------------------ */
/* Disease / Diagnosis Trends                                          */
/* ------------------------------------------------------------------ */

export interface DiagnosisFrequency {
  diagnosis: string
  cases: number
  [key: string]: string | number
}

export const TOP_DIAGNOSES: DiagnosisFrequency[] = []

const TREND_CONDITIONS = ["Hypertension", "Type 2 Diabetes", "Malaria", "Respiratory Infection"] as const

export const CONDITION_TREND_SERIES = TREND_CONDITIONS.map((label, i) => ({
  key: `condition${i}`,
  label,
  color: `var(--chart-${i + 1})`,
}))

export const CONDITION_MONTHLY_TREND: Record<string, string | number>[] = []

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

export const DEPARTMENT_PERFORMANCE: DepartmentPerformanceRow[] = []

/* ------------------------------------------------------------------ */
/* Patient Statistics                                                  */
/* ------------------------------------------------------------------ */

export const AGE_GROUP_DISTRIBUTION: { ageGroup: string; count: number }[] = []

export const GENDER_DISTRIBUTION: { label: string; value: number }[] = []

export const PATIENT_STATS = {
  totalPatients: 0,
  newThisMonth: 0,
  avgAge: 0,
  genderRatioLabel: "0:0",
}

/* ------------------------------------------------------------------ */
/* Financial Reports                                                   */
/* ------------------------------------------------------------------ */

export const REVENUE_VS_EXPENSES: { month: string; revenue: number; expenses: number }[] = []

export const FINANCIAL_STATS = {
  totalRevenueYTDLabel: formatNaira(0),
  totalExpensesYTDLabel: formatNaira(0),
  netMarginPercent: 0,
  outstandingReceivablesLabel: formatNaira(0),
}

export interface ReportLineItem {
  id: string
  name: string
  period: string
  generatedAt: string
  type: "Financial" | "Clinical"
}

export const FINANCIAL_REPORTS: ReportLineItem[] = []

/* ------------------------------------------------------------------ */
/* Clinical Reports                                                    */
/* ------------------------------------------------------------------ */

export const CLINICAL_STATS = {
  avgLengthOfStay: 0,
  mortalityRate: 0,
  infectionRate: 0,
  patientSatisfaction: 0,
}

export const CLINICAL_REPORTS: ReportLineItem[] = []
