import type { Metadata } from "next"
import { RadiologyHub } from "@/features/radiology/components/radiology-hub"

export const metadata: Metadata = { title: "Radiology" }

export default function RadiologyPage() {
  return <RadiologyHub />
}
