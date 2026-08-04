"use client"

import { useRef } from "react"
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  UnderlineIcon,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { SoapNotes } from "@/features/consultation/types"

type FormatKind = "bold" | "italic" | "underline" | "list" | "ordered-list"

const TOOLBAR_ITEMS: { kind: FormatKind; icon: typeof BoldIcon; label: string }[] = [
  { kind: "bold", icon: BoldIcon, label: "Bold" },
  { kind: "italic", icon: ItalicIcon, label: "Italic" },
  { kind: "underline", icon: UnderlineIcon, label: "Underline" },
  { kind: "list", icon: ListIcon, label: "Bulleted list" },
  { kind: "ordered-list", icon: ListOrderedIcon, label: "Numbered list" },
]

function FormattingToolbar({ onFormat }: { onFormat: (kind: FormatKind) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-1">
      {TOOLBAR_ITEMS.map(({ kind, icon: Icon, label }) => (
        <Button
          key={kind}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          onClick={() => onFormat(kind)}
        >
          <Icon />
        </Button>
      ))}
    </div>
  )
}

function SoapNotesSection({
  notes,
  onChange,
}: {
  notes: SoapNotes
  onChange: (notes: SoapNotes) => void
}) {
  const subjectiveRef = useRef<HTMLTextAreaElement>(null)

  function update(field: keyof SoapNotes, value: string) {
    onChange({ ...notes, [field]: value })
  }

  function handleFormat(kind: FormatKind) {
    const textarea = subjectiveRef.current
    if (!textarea) return

    const { selectionStart, selectionEnd, value } = textarea
    const selected = value.slice(selectionStart, selectionEnd)

    let inserted: string
    let cursorOffset: number

    switch (kind) {
      case "bold":
        inserted = `**${selected || "bold text"}**`
        cursorOffset = selected ? inserted.length : 2
        break
      case "italic":
        inserted = `_${selected || "italic text"}_`
        cursorOffset = selected ? inserted.length : 1
        break
      case "underline":
        inserted = `<u>${selected || "underlined text"}</u>`
        cursorOffset = selected ? inserted.length : 3
        break
      case "list":
        inserted = (selected || "List item")
          .split("\n")
          .map((line) => `- ${line}`)
          .join("\n")
        cursorOffset = inserted.length
        break
      case "ordered-list":
        inserted = (selected || "List item")
          .split("\n")
          .map((line, i) => `${i + 1}. ${line}`)
          .join("\n")
        cursorOffset = inserted.length
        break
    }

    const nextValue = value.slice(0, selectionStart) + inserted + value.slice(selectionEnd)
    update("subjective", nextValue)

    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = selectionStart + cursorOffset
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SOAP Notes</CardTitle>
        <CardDescription>Subjective, Objective, Assessment, and Plan for this visit</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <FormattingToolbar onFormat={handleFormat} />
          <Label htmlFor="soap-subjective">Subjective</Label>
          <Textarea
            id="soap-subjective"
            ref={subjectiveRef}
            placeholder="Patient reported symptoms, history of present illness, concerns..."
            className="min-h-24"
            value={notes.subjective}
            onChange={(e) => update("subjective", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="soap-objective">Objective</Label>
          <Textarea
            id="soap-objective"
            placeholder="Examination findings, vitals, observed signs..."
            className="min-h-24"
            value={notes.objective}
            onChange={(e) => update("objective", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="soap-assessment">Assessment</Label>
          <Textarea
            id="soap-assessment"
            placeholder="Diagnosis, differential diagnoses, clinical impressions..."
            className="min-h-24"
            value={notes.assessment}
            onChange={(e) => update("assessment", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="soap-plan">Plan</Label>
          <Textarea
            id="soap-plan"
            placeholder="Treatment plan, follow up instructions, referrals..."
            className="min-h-24"
            value={notes.plan}
            onChange={(e) => update("plan", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export { SoapNotesSection }
