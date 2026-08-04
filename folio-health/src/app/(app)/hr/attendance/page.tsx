import type { Metadata } from "next"
import { AttendanceList } from "@/features/hr/components/attendance-list"

export const metadata: Metadata = { title: "Attendance" }

export default function HrAttendancePage() {
  return <AttendanceList />
}
