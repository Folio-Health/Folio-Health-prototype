import type { Metadata } from "next"
import { AntenatalVisits } from "@/features/obstetrics/components/antenatal-visits"

export const metadata: Metadata = { title: "Antenatal Visits" }

export default function ObstetricsAntenatalPage() {
  return <AntenatalVisits />
}
