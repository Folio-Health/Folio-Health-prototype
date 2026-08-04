"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { HourglassIcon, CheckCircle2Icon, XCircleIcon, CalendarDaysIcon, SearchIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HrModuleTabs } from "./hr-module-tabs"
import { getLeaveColumns } from "./leave-columns"
import { LEAVE_REQUESTS, type LeaveRequest, type LeaveStatus } from "@/lib/mock/hr"
import { getStaffById } from "@/lib/mock/staff"

const ALL = "all"

function LeaveList() {
  const [statuses, setStatuses] = useState<Record<string, LeaveStatus>>(() => {
    const initial: Record<string, LeaveStatus> = {}
    for (const lv of LEAVE_REQUESTS) initial[lv.id] = lv.status
    return initial
  })
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)
  const [leaveType, setLeaveType] = useState(ALL)

  const rows = useMemo(
    () => LEAVE_REQUESTS.map((lv) => ({ ...lv, status: statuses[lv.id] ?? lv.status })),
    [statuses]
  )

  const filtered = useMemo(() => {
    return rows.filter((lv) => {
      if (status !== ALL && lv.status !== status) return false
      if (leaveType !== ALL && lv.leaveType !== leaveType) return false
      if (search) {
        const q = search.toLowerCase()
        const staff = getStaffById(lv.staffId)
        if (!staff?.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [rows, search, status, leaveType])

  const pendingCount = rows.filter((r) => r.status === "Pending").length
  const approvedCount = rows.filter((r) => r.status === "Approved").length
  const rejectedCount = rows.filter((r) => r.status === "Rejected").length
  const totalDaysRequested = rows.reduce((sum, r) => sum + r.days, 0)

  function handleApprove(leave: LeaveRequest) {
    setStatuses((prev) => ({ ...prev, [leave.id]: "Approved" }))
    const staff = getStaffById(leave.staffId)
    toast.success(`Leave request approved`, {
      description: staff ? `${staff.name}'s ${leave.leaveType.toLowerCase()} leave has been approved.` : undefined,
    })
  }

  function handleReject(leave: LeaveRequest) {
    setStatuses((prev) => ({ ...prev, [leave.id]: "Rejected" }))
    const staff = getStaffById(leave.staffId)
    toast.error(`Leave request rejected`, {
      description: staff ? `${staff.name}'s ${leave.leaveType.toLowerCase()} leave has been rejected.` : undefined,
    })
  }

  const columns = getLeaveColumns({ onApprove: handleApprove, onReject: handleReject })

  return (
    <div>
      <PageHeader
        title="Leave Management"
        description="Review and action staff leave requests"
        breadcrumbs={[{ label: "Facility" }, { label: "HR", href: "/hr" }, { label: "Leave" }]}
      />

      <HrModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending" value={pendingCount} icon={HourglassIcon} tone="amber" />
        <StatCard label="Approved" value={approvedCount} icon={CheckCircle2Icon} tone="emerald" />
        <StatCard label="Rejected" value={rejectedCount} icon={XCircleIcon} tone="red" />
        <StatCard label="Total Days Requested" value={totalDaysRequested} icon={CalendarDaysIcon} tone="violet" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No leave requests found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by staff name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={leaveType} onValueChange={(v) => setLeaveType(v ?? ALL)}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Leave Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Types</SelectItem>
                <SelectItem value="Annual">Annual</SelectItem>
                <SelectItem value="Sick">Sick</SelectItem>
                <SelectItem value="Maternity">Maternity</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { LeaveList }
