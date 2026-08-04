import type { Metadata } from "next"
import { ShiftPlanner } from "@/features/hr/components/shift-planner"

export const metadata: Metadata = { title: "Shift Planner" }

export default function HrShiftPlannerPage() {
  return <ShiftPlanner />
}
