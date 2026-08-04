import type { Metadata } from "next"
import { DonorsList } from "@/features/blood-bank/components/donors-list"

export const metadata: Metadata = { title: "Blood Donors" }

export default function BloodDonorsPage() {
  return <DonorsList />
}
