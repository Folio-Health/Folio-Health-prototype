"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon, StethoscopeIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { EmptyState } from "@/components/common/empty-state"
import { ListSkeleton } from "@/components/common/loading-skeletons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ENCOUNTER_STATUS_LABELS, encounterStatus, type EncounterStatus } from "@/lib/clinical/encounter"
import { useEncountersForDay } from "@/features/clinical/hooks/use-clinical"

const STATUS_TONE: Record<EncounterStatus, string> = {
  arrived: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  triaged: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "in-progress": "bg-primary/10 text-primary",
  finished: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground line-through",
}

const ORDER: EncounterStatus[] = ["in-progress", "triaged", "arrived", "finished", "cancelled"]

/**
 * The doctor's queue: the day's visits, with triaged patients ("ready for
 * doctor") ahead of untriaged ones, and finished visits at the bottom.
 * Opening a row goes to the clerking workspace for that visit.
 */
function ConsultationHub() {
  const [day, setDay] = useState(() => new Date())
  const { data: encounters, isPending } = useEncountersForDay(day)

  const rows = useMemo(
    () =>
      [...(encounters ?? [])].sort(
        (a, b) => ORDER.indexOf(encounterStatus(a)) - ORDER.indexOf(encounterStatus(b))
      ),
    [encounters]
  )
  const counts = useMemo(() => {
    const c = { arrived: 0, triaged: 0, "in-progress": 0, finished: 0, cancelled: 0 } as Record<EncounterStatus, number>
    for (const e of encounters ?? []) c[encounterStatus(e)] += 1
    return c
  }, [encounters])

  function shift(delta: number) {
    setDay((d) => {
      const n = new Date(d)
      n.setDate(n.getDate() + delta)
      return n
    })
  }
  const isToday = day.toDateString() === new Date().toDateString()

  return (
    <div>
      <PageHeader
        title="Consultation"
        description="Visits waiting for you — triaged patients first"
        breadcrumbs={[{ label: "Clinical" }, { label: "Consultation" }]}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Previous day" onClick={() => shift(-1)}>
            <ChevronLeftIcon />
          </Button>
          <Button variant={isToday ? "default" : "outline"} onClick={() => setDay(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" aria-label="Next day" onClick={() => shift(1)}>
            <ChevronRightIcon />
          </Button>
          <p className="ml-2 text-sm font-medium">{format(day, "EEEE, d MMMM yyyy")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ORDER.map((s) =>
            counts[s] > 0 ? (
              <Badge key={s} variant="outline" className="text-xs">
                {ENCOUNTER_STATUS_LABELS[s]}: {counts[s]}
              </Badge>
            ) : null
          )}
        </div>
      </div>

      {isPending ? (
        <ListSkeleton />
      ) : encounters === null ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Visits are not available for your role.</p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={StethoscopeIcon}
          title={isToday ? "No visits today" : "No visits this day"}
          description="Patients appear here once the front desk checks them in or a nurse opens a visit."
        />
      ) : (
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-2">
          {rows.map((encounter) => {
            const status = encounterStatus(encounter)
            const name = encounter.subject?.display ?? "Patient"
            return (
              <Link
                key={encounter.id}
                href={`/consultation/${encounter.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60"
              >
                <span className="w-14 shrink-0 text-sm tabular-nums text-muted-foreground">
                  {encounter.period?.start ? format(new Date(encounter.period.start), "HH:mm") : "—"}
                </span>
                <PersonAvatar name={name} size="sm" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-medium text-foreground">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {encounter.reasonCode?.[0]?.text ?? "No reason recorded"}
                    {encounter.participant?.[0]?.individual?.display
                      ? ` · ${encounter.participant[0].individual.display}`
                      : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONE[status]}`}>
                  {ENCOUNTER_STATUS_LABELS[status]}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { ConsultationHub }
