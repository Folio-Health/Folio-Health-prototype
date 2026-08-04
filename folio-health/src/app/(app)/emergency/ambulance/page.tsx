import type { Metadata } from "next"
import { AmbulanceTracking } from "@/features/emergency/components/ambulance-tracking"

export const metadata: Metadata = { title: "Ambulance Tracking" }

export default function EmergencyAmbulancePage() {
  return <AmbulanceTracking />
}
