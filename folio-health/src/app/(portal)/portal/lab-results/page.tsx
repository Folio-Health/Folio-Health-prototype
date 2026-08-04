import type { Metadata } from "next"
import { PortalLabResults } from "@/features/portal/components/portal-lab-results"

export const metadata: Metadata = { title: "Lab Results" }

export default function PortalLabResultsPage() {
  return <PortalLabResults />
}
