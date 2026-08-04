import type { Metadata } from "next"
import { CriticalPatients } from "@/features/emergency/components/critical-patients"

export const metadata: Metadata = { title: "Critical Patients" }

export default function EmergencyCriticalPage() {
  return <CriticalPatients />
}
