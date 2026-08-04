"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

function ClinicalNotesSection({
  notes,
  onChange,
}: {
  notes: string
  onChange: (notes: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinical Notes</CardTitle>
        <CardDescription>General free text notes for this visit, not tied to SOAP structure</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Additional observations, follow up reminders, internal notes..."
          className="min-h-48"
          value={notes}
          onChange={(e) => onChange(e.target.value)}
        />
      </CardContent>
    </Card>
  )
}

export { ClinicalNotesSection }
