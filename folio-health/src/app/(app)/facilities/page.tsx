import type { Metadata } from "next"
import { FacilitiesList } from "@/features/facilities/components/facilities-list"

export const metadata: Metadata = {
  title: "Facilities",
}

export default function FacilitiesPage() {
  return <FacilitiesList />
}
