"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { SearchIcon, TargetIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { PersonAvatar } from "@/components/common/person-avatar"
import { EmptyState } from "@/components/common/empty-state"
import { Progress } from "@/components/ui/progress"
import { NursingModuleTabs } from "./nursing-module-tabs"
import { CARE_PLANS } from "@/lib/mock/nursing"
import { getPatientById } from "@/lib/mock/patients"

function CarePlans() {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search) return CARE_PLANS
    const q = search.toLowerCase()
    return CARE_PLANS.filter((cp) => {
      const patient = getPatientById(cp.patientId)
      return patient?.name.toLowerCase().includes(q) || cp.goal.toLowerCase().includes(q)
    })
  }, [search])

  return (
    <div>
      <PageHeader
        title="Care Plans"
        description="Individualized nursing care plans, goals, and interventions"
        breadcrumbs={[{ label: "Clinical" }, { label: "Nursing", href: "/nursing" }, { label: "Care Plans" }]}
      />

      <NursingModuleTabs />

      <div className="mb-4">
        <InputGroup className="h-9 max-w-xs">
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by patient or goal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={TargetIcon}
          title="No care plans found"
          description="Try adjusting your search terms."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((plan) => {
            const patient = getPatientById(plan.patientId)
            return (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <PersonAvatar name={patient?.name ?? "Patient"} seed={patient?.avatarSeed} size="sm" />
                    <div>
                      <CardTitle>{patient?.name ?? "Unknown Patient"}</CardTitle>
                      <CardDescription>{patient?.mrn}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Goal</p>
                    <p className="text-sm font-medium text-foreground">{plan.goal}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Interventions</p>
                    <ul className="flex flex-col gap-1">
                      {plan.interventions.map((intervention) => (
                        <li key={intervention} className="flex items-start gap-1.5 text-sm text-foreground">
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                          {intervention}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Target Date</span>
                    <span className="font-medium text-foreground">
                      {format(new Date(plan.targetDate), "MMM d, yyyy")}
                    </span>
                  </div>
                  <Progress value={plan.progress} className="gap-1.5">
                    <div className="flex w-full items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">{plan.progress}%</span>
                    </div>
                  </Progress>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { CarePlans }
