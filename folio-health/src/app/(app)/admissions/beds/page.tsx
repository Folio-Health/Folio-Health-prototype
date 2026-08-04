import type { Metadata } from "next"
import { BedAllocation } from "@/features/admissions/components/bed-allocation"

export const metadata: Metadata = { title: "Bed Allocation" }

export default function AdmissionsBedsPage() {
  return <BedAllocation />
}
