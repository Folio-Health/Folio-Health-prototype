"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { SearchIcon, ListChecksIcon, ClockIcon, CheckCircle2Icon } from "lucide-react"
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
import { NursingModuleTabs } from "./nursing-module-tabs"
import { getTasksColumns } from "./tasks-columns"
import { NURSING_TASKS, type NursingTask } from "@/lib/mock/nursing"

const ALL = "all"

function TasksList() {
  const [tasks, setTasks] = useState<NursingTask[]>(NURSING_TASKS)
  const [search, setSearch] = useState("")
  const [priority, setPriority] = useState(ALL)

  function handleToggleDone(task: NursingTask) {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: t.status === "Done" ? "Pending" : "Done" } : t))
    )
    toast.success(task.status === "Done" ? `Reopened "${task.task}"` : `Completed "${task.task}"`)
  }

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (priority !== ALL && t.priority !== priority) return false
      if (search && !t.task.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [tasks, search, priority])

  const pending = tasks.filter((t) => t.status === "Pending").length
  const inProgress = tasks.filter((t) => t.status === "In Progress").length
  const done = tasks.filter((t) => t.status === "Done").length

  const columns = getTasksColumns({ onToggleDone: handleToggleDone })

  return (
    <div>
      <PageHeader
        title="Nursing Tasks"
        description="Your task checklist for the current shift"
        breadcrumbs={[{ label: "Clinical" }, { label: "Nursing", href: "/nursing" }, { label: "Tasks" }]}
      />

      <NursingModuleTabs />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Pending" value={pending} icon={ListChecksIcon} tone="amber" />
        <StatCard label="In Progress" value={inProgress} icon={ClockIcon} tone="violet" />
        <StatCard label="Done" value={done} icon={CheckCircle2Icon} tone="emerald" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No tasks found"
        emptyDescription="Try adjusting your search or filters."
        toolbar={
          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Select value={priority} onValueChange={(v) => setPriority(v ?? ALL)}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Priorities</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  )
}

export { TasksList }
