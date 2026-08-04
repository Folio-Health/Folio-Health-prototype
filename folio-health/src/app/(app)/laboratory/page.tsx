import type { Metadata } from "next"
import { LaboratoryHub } from "@/features/laboratory/components/laboratory-hub"

export const metadata: Metadata = { title: "Laboratory" }

export default function LaboratoryPage() {
  return <LaboratoryHub />
}
