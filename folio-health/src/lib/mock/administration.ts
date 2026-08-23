// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.

/* ------------------------------------------------------------------ */
/* Audit logs                                                          */
/* ------------------------------------------------------------------ */

export type AuditAction = "Created" | "Updated" | "Deleted" | "Login" | "Logout"
export type AuditStatus = "Success" | "Failed"

export interface AuditLogEntry {
  id: string
  timestamp: string
  staffId: string
  action: AuditAction
  entity: string
  ipAddress: string
  status: AuditStatus
}

export const AUDIT_LOGS: AuditLogEntry[] = []

/* ------------------------------------------------------------------ */
/* Activity logs                                                       */
/* ------------------------------------------------------------------ */

export interface ActivityLogEntry {
  id: string
  timestamp: string
  staffId: string
  activity: string
  module: string
}

export const ACTIVITY_LOGS: ActivityLogEntry[] = []

/* ------------------------------------------------------------------ */
/* System users (last active)                                          */
/* ------------------------------------------------------------------ */

export const LAST_ACTIVE: Record<string, string> = {}
