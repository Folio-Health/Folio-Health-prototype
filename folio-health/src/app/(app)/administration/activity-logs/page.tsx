import type { Metadata } from "next"
import { ActivityLogsList } from "@/features/administration/components/activity-logs-list"

export const metadata: Metadata = { title: "Activity Logs" }

export default function AdministrationActivityLogsPage() {
  return <ActivityLogsList />
}
