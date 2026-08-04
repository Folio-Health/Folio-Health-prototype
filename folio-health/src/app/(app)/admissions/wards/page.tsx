import type { Metadata } from "next"
import { WardManagement } from "@/features/admissions/components/ward-management"

export const metadata: Metadata = { title: "Ward Management" }

export default function AdmissionsWardsPage() {
  return <WardManagement />
}
