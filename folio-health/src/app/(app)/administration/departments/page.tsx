import type { Metadata } from "next"
import { DepartmentsTable } from "@/features/administration/components/departments-table"

export const metadata: Metadata = { title: "Department Management" }

export default function AdministrationDepartmentsPage() {
  return <DepartmentsTable />
}
