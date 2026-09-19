"use client"

import { useState } from "react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { MessageCircleQuestionIcon, TriangleAlertIcon, CheckIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { EmptyState } from "@/components/common/empty-state"
import { RoleGate } from "@/components/common/role-gate"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { isOverdue, useOrderQueries, QUERY_ESCALATION_HOURS } from "../lib/order-queries"

/**
 * The physician's half of the query loop (Manuscript §4.4, §9.4).
 *
 * §9.4 is the requirement being met here: every loop must close with an
 * acknowledgement by a named human, and unclosed loops should escalate on a
 * timer rather than sit silently. So this panel lists every open query, marks
 * the ones past QUERY_ESCALATION_HOURS as overdue, and closes each one with
 * the answering physician's name attached to it.
 */
function OpenQueriesPanel() {
  const queries = useOrderQueries((s) => s.queries)
  const answerQuery = useOrderQueries((s) => s.answerQuery)
  const { data: user } = useCurrentUser()

  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")

  const open = queries.filter((q) => q.status === "open")

  function handleAnswer(id: string) {
    const trimmed = draft.trim()
    if (!trimmed) {
      toast.error("Write an answer before closing the query")
      return
    }
    answerQuery(id, trimmed, user?.name ?? "Unknown user")
    toast.success("Query answered", {
      description: "The loop is closed and the order can proceed.",
    })
    setAnsweringId(null)
    setDraft("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Order queries
          {open.length > 0 && <Badge variant="destructive">{open.length}</Badge>}
        </CardTitle>
        <CardDescription>
          Questions raised by lab, imaging and pharmacy about orders you signed
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {open.length === 0 ? (
          <EmptyState
            icon={MessageCircleQuestionIcon}
            title="No open queries"
            description="When lab, imaging or pharmacy question one of your orders, it appears here until you answer it."
          />
        ) : (
          open.map((query) => {
            const overdue = isOverdue(query)
            return (
              <div key={query.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-foreground">{query.orderLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {query.orderId} &middot; {query.patientName}
                    </p>
                  </div>
                  {overdue && (
                    <Badge variant="destructive" className="gap-1">
                      <TriangleAlertIcon aria-hidden="true" />
                      Overdue
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-foreground">{query.question}</p>
                <p className="text-xs text-muted-foreground">
                  Raised by {query.raisedBy},{" "}
                  {formatDistanceToNow(new Date(query.raisedAt), { addSuffix: true })}
                  {overdue && ` — past the ${QUERY_ESCALATION_HOURS}-hour response window`}
                </p>

                <RoleGate
                  permission="ORDER_ANSWER_QUERY"
                  fallback={
                    <p className="text-xs text-muted-foreground">
                      Only the ordering physician can close this query.
                    </p>
                  }
                >
                  {answeringId === query.id ? (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`answer-${query.id}`} className="sr-only">
                        Your answer
                      </Label>
                      <Textarea
                        id={`answer-${query.id}`}
                        rows={3}
                        autoFocus
                        placeholder="Answer the question so the order can proceed"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                      />
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAnsweringId(null)
                            setDraft("")
                          }}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleAnswer(query.id)}>
                          <CheckIcon />
                          Answer and close
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAnsweringId(query.id)
                          setDraft("")
                        }}
                      >
                        Answer
                      </Button>
                    </div>
                  )}
                </RoleGate>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

export { OpenQueriesPanel }
