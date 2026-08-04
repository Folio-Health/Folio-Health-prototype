"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { ScrollTextIcon, ShieldAlertIcon, LogInIcon, SearchIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdministrationModuleTabs } from "./administration-module-tabs"
import { auditLogsColumns } from "./audit-logs-columns"
import { AUDIT_LOGS } from "@/lib/mock/administration"
import { getStaffById } from "@/lib/mock/staff"

const ALL = "all"

function AuditLogsList() {
  const [search, setSearch] = useState("")
  const [action, setAction] = useState(ALL)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const filtered = useMemo(() => {
    return AUDIT_LOGS.filter((log) => {
      if (action !== ALL && log.action !== action) return false
      const day = format(new Date(log.timestamp), "yyyy-MM-dd")
      if (from && day < from) return false
      if (to && day > to) return false
      if (search) {
        const q = search.toLowerCase()
        const staff = getStaffById(log.staffId)
        if (
          !staff?.name.toLowerCase().includes(q) &&
          !log.entity.toLowerCase().includes(q) &&
          !log.ipAddress.includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [search, action, from, to])

  const failedCount = AUDIT_LOGS.filter((l) => l.status === "Failed").length
  const loginCount = AUDIT_LOGS.filter((l) => l.action === "Login").length

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="System-wide record of user actions for compliance and security review"
        breadcrumbs={[{ label: "System" }, { label: "Administration" }, { label: "Audit Logs" }]}
      />

      <AdministrationModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Events" value={AUDIT_LOGS.length} icon={ScrollTextIcon} />
        <StatCard label="Failed Events" value={failedCount} icon={ShieldAlertIcon} tone="red" />
        <StatCard label="Login Events" value={loginCount} icon={LogInIcon} tone="violet" />
      </div>

      <DataTable
        columns={auditLogsColumns}
        data={filtered}
        emptyTitle="No audit log entries found"
        emptyDescription="Try adjusting your search, date range, or action filter."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by user, entity, or IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40" />
            <span className="text-sm text-muted-foreground">to</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-40" />
            <Select value={action} onValueChange={(v) => setAction(v ?? ALL)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Actions</SelectItem>
                <SelectItem value="Created">Created</SelectItem>
                <SelectItem value="Updated">Updated</SelectItem>
                <SelectItem value="Deleted">Deleted</SelectItem>
                <SelectItem value="Login">Login</SelectItem>
                <SelectItem value="Logout">Logout</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { AuditLogsList }
