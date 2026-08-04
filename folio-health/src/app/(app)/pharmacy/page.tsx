import type { Metadata } from "next"
import { PharmacyList } from "@/features/pharmacy/components/pharmacy-list"

export const metadata: Metadata = { title: "Pharmacy" }

export default function PharmacyPage() {
  return <PharmacyList />
}
