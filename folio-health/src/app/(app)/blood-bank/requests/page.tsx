import type { Metadata } from "next"
import { BloodRequestsList } from "@/features/blood-bank/components/blood-requests-list"

export const metadata: Metadata = { title: "Blood Requests" }

export default function BloodRequestsPage() {
  return <BloodRequestsList />
}
