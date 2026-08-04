"use client"

import { useMemo, useState } from "react"
import { CalendarCheckIcon, CalendarXIcon, ClockAlertIcon, TimerIcon, SearchIcon } from "lucide-react"
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
import { HrModuleTabs } from "./hr-module-tabs"
import { attendanceColumns } from "./attendance-columns"
import { ATTENDANCE_RECORDS } from "@/lib/mock/hr"
import { getStaffById } from "@/lib/mock/staff"
import { format } from "date-fns"

const ALL = "all"

function AttendanceList() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)
  const [date, setDate] = useState("")

  const filtered = useMemo(() => {
    return ATTENDANCE_RECORDS.filter((rec) => {
      if (status !== ALL && rec.status !== status) return false
      if (date && format(new Date(rec.date), "yyyy-MM-dd") !== date) return false
      if (search) {
        const q = search.toLowerCase()
        const staff = getStaffById(rec.staffId)
        if (!staff?.name.toLowerCase().includes(q) && !staff?.staffId.toLowerCase().includes(q)) {
          return false
        }
      }
      return true
    })
  }, [search, status, date])

  const presentCount = ATTENDANCE_RECORDS.filter((r) => r.status === "Present").length
  const absentCount = ATTENDANCE_RECORDS.filter((r) => r.status === "Absent").length
  const lateCount = ATTENDANCE_RECORDS.filter((r) => r.status === "Late").length
  const workedRecords = ATTENDANCE_RECORDS.filter((r) => r.hoursWorked > 0)
  const avgHours =
    workedRecords.length > 0
      ? workedRecords.reduce((sum, r) => sum + r.hoursWorked, 0) / workedRecords.length
      : 0

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Daily clock in and clock out records across all staff"
        breadcrumbs={[{ label: "Facility" }, { label: "HR", href: "/hr" }, { label: "Attendance" }]}
      />

      <HrModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Present Records" value={presentCount} icon={CalendarCheckIcon} tone="emerald" />
        <StatCard label="Absent Records" value={absentCount} icon={CalendarXIcon} tone="red" />
        <StatCard label="Late Records" value={lateCount} icon={ClockAlertIcon} tone="amber" />
        <StatCard label="Avg. Hours Worked" value={avgHours.toFixed(1)} icon={TimerIcon} tone="violet" />
      </div>

      <DataTable
        columns={attendanceColumns}
        data={filtered}
        emptyTitle="No attendance records found"
        emptyDescription="Try adjusting your search, date, or status filter."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by staff name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 w-40"
            />
            <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Statuses</SelectItem>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { AttendanceList }
