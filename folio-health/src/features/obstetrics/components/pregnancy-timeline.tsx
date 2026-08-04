"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { SearchIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/common/empty-state"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ObstetricsModuleTabs } from "./obstetrics-module-tabs"
import { PREGNANCIES } from "@/lib/mock/obstetrics"
import { getPatientById } from "@/lib/mock/patients"

const ALL = "all"
const RISK_TONE = { Low: "green", Medium: "amber", High: "red" } as const

function PregnancyTimeline() {
  const [search, setSearch] = useState("")
  const [risk, setRisk] = useState(ALL)

  const filtered = useMemo(() => {
    return PREGNANCIES.filter((p) => {
      if (risk !== ALL && p.riskLevel !== risk) return false
      if (search) {
        const patient = getPatientById(p.patientId)
        if (!patient?.name.toLowerCase().includes(search.toLowerCase())) return false
      }
      return true
    })
  }, [search, risk])

  return (
    <div>
      <PageHeader
        title="Pregnancy Timeline"
        description="Gestational progress and risk level for currently pregnant patients"
        breadcrumbs={[{ label: "Clinical" }, { label: "Obstetrics", href: "/obstetrics" }, { label: "Pregnancy Timeline" }]}
      />

      <ObstetricsModuleTabs />

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <InputGroup className="h-9 max-w-xs">
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
        <Select value={risk} onValueChange={(v) => setRisk(v ?? ALL)}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Risk Levels</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No pregnancies found" description="Try adjusting your search or filters." />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((pregnancy) => {
            const patient = getPatientById(pregnancy.patientId)
            const pct = Math.round((pregnancy.gestationalWeek / 40) * 100)
            return (
              <Card key={pregnancy.id}>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href={`/patients/${pregnancy.patientId}`}
                    className="flex items-center gap-2.5 sm:w-56 sm:shrink-0"
                  >
                    <PersonAvatar name={patient?.name ?? "Patient"} seed={patient?.avatarSeed} size="sm" />
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground hover:text-primary hover:underline">
                        {patient?.name ?? "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">{patient?.mrn}</span>
                    </div>
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">Week {pregnancy.gestationalWeek} of 40</span>
                      <span className="text-muted-foreground">
                        EDD {format(new Date(pregnancy.edd), "MMM d, yyyy")}
                      </span>
                    </div>
                    <Progress value={pct} />
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:w-28 sm:justify-end">
                    <StatusBadge status={pregnancy.riskLevel} tone={RISK_TONE[pregnancy.riskLevel]} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { PregnancyTimeline }
