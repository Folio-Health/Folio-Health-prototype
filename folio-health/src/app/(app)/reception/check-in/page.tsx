import type { Metadata } from "next"
import { CheckInList } from "@/features/reception/components/check-in-list"

export const metadata: Metadata = { title: "Check In" }

export default function CheckInPage() {
  return <CheckInList />
}
