import type { Metadata } from "next"
import { DepartmentsList } from "@/features/hr/components/departments-list"

export const metadata: Metadata = { title: "HR Departments" }

export default function HrDepartmentsPage() {
  return <DepartmentsList />
}
