import type { Metadata } from "next"
import { TransfersList } from "@/features/admissions/components/transfers-list"

export const metadata: Metadata = { title: "Patient Transfers" }

export default function AdmissionsTransfersPage() {
  return <TransfersList />
}
