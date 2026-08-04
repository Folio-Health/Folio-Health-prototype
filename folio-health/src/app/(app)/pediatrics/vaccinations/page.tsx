import type { Metadata } from "next"
import { VaccinationsList } from "@/features/pediatrics/components/vaccinations-list"

export const metadata: Metadata = { title: "Vaccinations" }

export default function PediatricsVaccinationsPage() {
  return <VaccinationsList />
}
