import type { Metadata } from "next"
import { BloodBankInventory } from "@/features/blood-bank/components/blood-bank-inventory"

export const metadata: Metadata = { title: "Blood Bank" }

export default function BloodBankPage() {
  return <BloodBankInventory />
}
