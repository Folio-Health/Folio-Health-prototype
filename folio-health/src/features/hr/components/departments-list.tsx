"use client"

import { useMemo, useState } from "react"
import { Building2Icon, SearchIcon, UsersIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { EmptyState } from "@/components/common/empty-state"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { HrModuleTabs } from "./hr-module-tabs"
import { getDepartmentSummaries } from "@/lib/mock/hr"

function DepartmentsList() {
  const [search, setSearch] = useState("")
  const departments = useMemo(() => getDepartmentSummaries(), [])

  const filtered = useMemo(() => {
    if (!search) return departments
    const q = search.toLowerCase()
    return departments.filter(
      (d) => d.department.toLowerCase().includes(q) || d.head.toLowerCase().includes(q)
    )
  }, [departments, search])

  return (
    <div>
      <PageHeader
        title="Departments"
        description={`${departments.length} departments across the hospital`}
        breadcrumbs={[{ label: "Facility" }, { label: "HR", href: "/hr" }, { label: "Departments" }]}
      />

      <HrModuleTabs />

      <div className="mb-4">
        <InputGroup className="h-9 max-w-xs">
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by department or head..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No departments found" description="Try adjusting your search." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((dept) => (
            <Card key={dept.department} className="gap-3">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2Icon className="size-4.5" />
                  </div>
                  <CardTitle className="text-base">{dept.department}</CardTitle>
                </div>
                <StatusBadge status={dept.status} />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">{dept.description}</p>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <PersonAvatar name={dept.head} size="sm" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Head of Department</span>
                      <span className="text-sm font-medium text-foreground">{dept.head}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UsersIcon className="size-4" />
                  {dept.staffCount} {dept.staffCount === 1 ? "staff member" : "staff members"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export { DepartmentsList }
