"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { SearchIcon, ClipboardListIcon, PillIcon, TriangleAlertIcon, CalendarClockIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/tables/data-table"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PharmacyModuleTabs } from "./pharmacy-module-tabs"
import { getPrescriptionColumns } from "./prescription-columns"
import { PRESCRIPTIONS, DRUGS, isToday, getInventoryStatus, isExpiringThisMonth } from "@/lib/mock/pharmacy"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import { format } from "date-fns"
import type { Prescription, PrescriptionStatus } from "@/lib/mock/pharmacy"

const ALL = "all"
const TABS: { value: string; label: string }[] = [
  { value: ALL, label: "All Prescriptions" },
  { value: "To Dispense", label: "To Dispense" },
  { value: "Dispensed", label: "Dispensed" },
  { value: "Cancelled", label: "Cancelled" },
]

function PharmacyList() {
  const [statuses, setStatuses] = useState<Record<string, PrescriptionStatus>>(() => {
    const initial: Record<string, PrescriptionStatus> = {}
    for (const rx of PRESCRIPTIONS) initial[rx.id] = rx.status
    return initial
  })
  const [tab, setTab] = useState(ALL)
  const [search, setSearch] = useState("")
  const [viewing, setViewing] = useState<Prescription | null>(null)

  const rows = useMemo(
    () => PRESCRIPTIONS.map((rx) => ({ ...rx, status: statuses[rx.id] ?? rx.status })),
    [statuses]
  )

  const filtered = useMemo(() => {
    return rows.filter((rx) => {
      if (tab !== ALL && rx.status !== tab) return false
      if (search) {
        const q = search.toLowerCase()
        const patient = getPatientById(rx.patientId)
        if (
          !rx.id.toLowerCase().includes(q) &&
          !patient?.name.toLowerCase().includes(q) &&
          !rx.medications.some((m) => m.drugName.toLowerCase().includes(q))
        ) {
          return false
        }
      }
      return true
    })
  }, [rows, tab, search])

  const toDispenseCount = rows.filter((r) => r.status === "To Dispense").length
  const dispensedTodayCount = rows.filter((r) => r.status === "Dispensed" && isToday(r.date)).length
  const lowStockCount = DRUGS.filter((d) => getInventoryStatus(d) === "Low Stock").length
  const expiringThisMonthCount = DRUGS.filter((d) => isExpiringThisMonth(d)).length

  function handleDispense(rx: Prescription) {
    setStatuses((prev) => ({ ...prev, [rx.id]: "Dispensed" }))
    const patient = getPatientById(rx.patientId)
    toast.success(`${rx.id} dispensed`, {
      description: patient ? `Medications released to ${patient.name}.` : undefined,
    })
    setViewing(null)
  }

  function handlePrint(rx: Prescription) {
    toast.success(`Sending ${rx.id} to printer...`)
  }

  const columns = getPrescriptionColumns({
    onView: (rx) => setViewing(rx),
    onDispense: handleDispense,
    onPrint: handlePrint,
  })

  const viewingPatient = viewing ? getPatientById(viewing.patientId) : undefined
  const viewingDoctor = viewing ? getStaffById(viewing.prescribedByStaffId) : undefined

  return (
    <div>
      <PageHeader
        title="Pharmacy"
        description="Prescriptions awaiting dispensing and dispensing history"
        breadcrumbs={[{ label: "Pharmacy & Finance" }, { label: "Pharmacy" }]}
      />

      <PharmacyModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="To Dispense" value={toDispenseCount} icon={ClipboardListIcon} tone="amber" />
        <StatCard label="Dispensed Today" value={dispensedTodayCount} icon={PillIcon} tone="emerald" />
        <StatCard label="Low Stock Items" value={lowStockCount} icon={TriangleAlertIcon} tone="red" />
        <StatCard label="Expiring This Month" value={expiringThisMonthCount} icon={CalendarClockIcon} tone="violet" />
      </div>

      <Tabs value={tab} onValueChange={(v) => v && setTab(v)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(rx) => setViewing(rx)}
          emptyTitle="No prescriptions found"
          emptyDescription="Try adjusting your search or filters."
          toolbar={
            <InputGroup className="h-9 max-w-xs">
              <InputGroupAddon>
                <SearchIcon className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by Rx ID, patient, or drug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          }
        />
      </div>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.id}</DialogTitle>
                <DialogDescription>
                  Prescribed {format(new Date(viewing.date), "dd MMM yyyy, h:mm a")} by{" "}
                  {viewingDoctor?.name ?? "Unknown"}
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2.5">
                  {viewingPatient && (
                    <PersonAvatar name={viewingPatient.name} seed={viewingPatient.avatarSeed} size="sm" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {viewingPatient?.name ?? "Unknown patient"}
                    </span>
                    <span className="text-xs text-muted-foreground">{viewingPatient?.mrn}</span>
                  </div>
                </div>
                <StatusBadge status={viewing.status} />
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="h-9 px-3">Medication</TableHead>
                      <TableHead className="h-9 px-3">Dosage</TableHead>
                      <TableHead className="h-9 px-3 text-right">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewing.medications.map((med, i) => (
                      <TableRow key={`${med.drugId}-${i}`}>
                        <TableCell className="px-3 py-2 font-medium text-foreground">{med.drugName}</TableCell>
                        <TableCell className="px-3 py-2 text-muted-foreground">{med.dosage}</TableCell>
                        <TableCell className="px-3 py-2 text-right tabular-nums">{med.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter showCloseButton>
                {viewing.status === "To Dispense" && (
                  <Button onClick={() => handleDispense(viewing)}>
                    <PillIcon />
                    Dispense
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { PharmacyList }
