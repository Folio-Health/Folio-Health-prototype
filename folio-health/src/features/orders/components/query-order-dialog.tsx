"use client"

import { useState } from "react"
import { toast } from "sonner"
import { MessageCircleQuestionIcon } from "lucide-react"
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
import { useOrderQueries, type OrderKind } from "../lib/order-queries"

/**
 * Raise a query against an order, back to the physician who signed it
 * (Manuscript §4.4 / §4.5).
 *
 * The example the mentor gave is literally "why is this test being ordered
 * given X" — clinical collaboration, not a complaint, so the copy here frames
 * it as a question to a colleague rather than a rejection.
 */
function QueryOrderDialog({
  open,
  onOpenChange,
  orderId,
  orderKind,
  orderLabel,
  patientId,
  patientName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  orderKind: OrderKind
  orderLabel: string
  patientId: string
  patientName: string
}) {
  const [question, setQuestion] = useState("")
  const raiseQuery = useOrderQueries((s) => s.raiseQuery)
  const { data: user } = useCurrentUser()

  function handleSubmit() {
    const trimmed = question.trim()
    if (!trimmed) {
      toast.error("Write your question before sending it")
      return
    }

    raiseQuery({
      orderId,
      orderKind,
      orderLabel,
      patientId,
      patientName,
      question: trimmed,
      raisedBy: user?.name ?? "Unknown user",
    })

    toast.success(`Query sent on ${orderId}`, {
      description: "The ordering physician will see it on their dashboard.",
    })
    setQuestion("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Query this order</DialogTitle>
          <DialogDescription>
            Ask the ordering physician about {orderLabel} for {patientName}. They answer on their
            own dashboard, and the order stays open until they do.
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
            Sent as {user?.name ?? "your account"}. Questions and answers both stay on the order.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <MessageCircleQuestionIcon />
            Send query
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { QueryOrderDialog }
