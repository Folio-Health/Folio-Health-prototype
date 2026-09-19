"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2Icon, MessageCircleQuestionIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { useRaiseQuery } from "../lib/order-queries"

/**
 * Raise a query against an order, back to the physician who signed it
 * (Manuscript §4.4 / §4.5).
 *
 * The example the mentor gave is literally "why is this test being ordered
 * given X" — clinical collaboration, not a complaint, so the copy frames it
 * as a question to a colleague rather than a rejection.
 */
function QueryOrderDialog({
  open,
  onOpenChange,
  focusRef,
  orderLabel,
  patientRef,
  patientName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** "ServiceRequest/123" or "MedicationRequest/456". */
  focusRef: string
  orderLabel: string
  patientRef: string
  patientName: string
}) {
  const [question, setQuestion] = useState("")
  const raise = useRaiseQuery()
  const { data: user } = useCurrentUser()

  async function handleSubmit() {
    const trimmed = question.trim()
    if (!trimmed) {
      toast.error("Write your question before sending it")
      return
    }

    try {
      await raise.mutateAsync({
        focusRef,
        orderLabel,
        patientRef,
        patientName,
        question: trimmed,
        raisedBy: user?.name ?? "Unknown user",
      })
      toast.success("Query sent", {
        description: "The ordering physician sees it on their dashboard until they answer.",
      })
      setQuestion("")
      onOpenChange(false)
    } catch (error) {
      toast.error("Could not send the query", {
        description: error instanceof Error ? error.message : "Try again.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Query this order</DialogTitle>
          <DialogDescription>
            Ask the ordering physician about {orderLabel} for {patientName}. The order stays open
            until they answer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="order-query-question">Your question</Label>
          <Textarea
            id="order-query-question"
            rows={4}
            placeholder="e.g. Patient is on anticoagulants — should this still be collected today?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Sent as {user?.name ?? "your account"}. The question and the answer both stay on the
            order.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={raise.isPending}>
            {raise.isPending ? <Loader2Icon className="animate-spin" /> : <MessageCircleQuestionIcon />}
            Send query
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { QueryOrderDialog }
