import type { Metadata } from "next"
import { LeaveList } from "@/features/hr/components/leave-list"

export const metadata: Metadata = { title: "Leave Management" }

export default function HrLeavePage() {
  return <LeaveList />
}
