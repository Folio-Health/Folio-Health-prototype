import {
  FileTextIcon,
  FlaskConicalIcon,
  PillIcon,
  ScanIcon,
  StickyNoteIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { WorkspaceSection } from "@/features/consultation/types"

const QUICK_ACTIONS: { label: string; icon: typeof FileTextIcon; section: WorkspaceSection }[] = [
  { label: "Add Diagnosis", icon: FileTextIcon, section: "soap-notes" },
  { label: "Add Medication", icon: PillIcon, section: "medications" },
  { label: "Add Lab Test", icon: FlaskConicalIcon, section: "orders" },
  { label: "Add Radiology", icon: ScanIcon, section: "orders" },
  { label: "Add Note", icon: StickyNoteIcon, section: "clinical-notes" },
]

function QuickActionsPanel({ onNavigate }: { onNavigate: (section: WorkspaceSection) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="justify-start"
            onClick={() => onNavigate(action.section)}
          >
            <action.icon />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

export { QuickActionsPanel }
