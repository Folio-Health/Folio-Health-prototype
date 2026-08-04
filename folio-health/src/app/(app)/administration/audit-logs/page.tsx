import type { Metadata } from "next"
import { AuditLogsList } from "@/features/administration/components/audit-logs-list"

export const metadata: Metadata = { title: "Audit Logs" }

export default function AdministrationAuditLogsPage() {
  return <AuditLogsList />
}
