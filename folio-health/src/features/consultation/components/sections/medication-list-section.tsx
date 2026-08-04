"use client"

import { useState } from "react"
import { PillIcon, PlusIcon, XIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/common/empty-state"
import type { MedicationItem } from "@/features/consultation/types"

function MedicationListSection({
  title,
  description,
  medications,
  onAdd,
  onRemove,
}: {
  title: string
  description: string
  medications: MedicationItem[]
  onAdd: (medication: Omit<MedicationItem, "id">) => void
  onRemove: (id: string) => void
}) {
  const [drugName, setDrugName] = useState("")
  const [dosage, setDosage] = useState("")
  const [frequency, setFrequency] = useState("")
  const [duration, setDuration] = useState("")

  function handleAdd() {
    if (!drugName.trim() || !dosage.trim() || !frequency.trim() || !duration.trim()) return
    onAdd({ drugName: drugName.trim(), dosage: dosage.trim(), frequency: frequency.trim(), duration: duration.trim() })
    setDrugName("")
    setDosage("")
    setFrequency("")
    setDuration("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label>Drug Name</Label>
            <Input placeholder="e.g. Amoxicillin" value={drugName} onChange={(e) => setDrugName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Dosage</Label>
            <Input placeholder="e.g. 500mg" value={dosage} onChange={(e) => setDosage(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Frequency</Label>
            <Input placeholder="e.g. Twice daily" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Duration</Label>
            <Input placeholder="e.g. 7 days" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <Button type="button" onClick={handleAdd} className="sm:col-span-2 lg:col-span-4 lg:w-fit">
            <PlusIcon />
            Add
          </Button>
        </div>

        {medications.length === 0 ? (
          <EmptyState
            icon={PillIcon}
            title="No medications added"
            description="Medications added for this visit will appear here."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {medications.map((med) => (
              <div
                key={med.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="font-medium text-foreground">{med.drugName}</span>
                  <span className="text-muted-foreground">{med.dosage}</span>
                  <span className="text-muted-foreground">{med.frequency}</span>
                  <span className="text-muted-foreground">{med.duration}</span>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => onRemove(med.id)}>
                  <XIcon />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { MedicationListSection }
