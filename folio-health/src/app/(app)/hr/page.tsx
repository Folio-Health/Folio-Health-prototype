import type { Metadata } from "next"
import { StaffDirectoryList } from "@/features/hr/components/staff-directory-list"

export const metadata: Metadata = { title: "Staff Directory" }

export default function HrPage() {
  return <StaffDirectoryList />
}
