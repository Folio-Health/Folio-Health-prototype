"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

/**
 * Order queries — the flag/query-back channel (Manuscript §4.4, §4.5).
 *
 * The manuscript is specific that a diagnostic role can flag or query an order
 * back to the physician ("why is this test being ordered given X") and that
 * this is *a two-way channel, not a one-way results pipe*. §9.4 then makes the
 * requirement structural: **every loop must close with an acknowledgement by a
 * named human**, and unclosed loops should escalate on a timer rather than sit
 * silently. §9 adds that a flagged query must be an explicit, tracked loop —
 * not a side conversation.
 *
 * So a query here is a record with two named humans on it: who raised it and
 * who answered it. It is never deleted (§9.2 "nothing is ever deleted") —
 * answering transitions it to `answered`, leaving the original text intact.
 *
 * STORAGE: zustand + localStorage, i.e. this device only. That is a frontend
 * stand-in for a FHIR `Task` against the `ServiceRequest` (§4.4's own mapping)
 * and is deliberately not presented in the UI as anything more durable.
 */

export type OrderKind = "lab" | "imaging" | "medication"

export type OrderQueryStatus = "open" | "answered"

export interface OrderQuery {
  id: string
  /** The order this query hangs off — e.g. "LAB-0042", "RAD-0007". */
  orderId: string
  orderKind: OrderKind
  /** Shown so the physician knows what they are being asked about. */
  orderLabel: string
  patientId: string
  patientName: string
  /** The question. */
  question: string
  /** Named human who raised it (§9.5: each transition stamped with who). */
  raisedBy: string
  raisedAt: string
  status: OrderQueryStatus
  answer?: string
  answeredBy?: string
  answeredAt?: string
}

interface OrderQueryState {
  queries: OrderQuery[]
  raiseQuery: (
    input: Omit<OrderQuery, "id" | "raisedAt" | "status" | "answer" | "answeredBy" | "answeredAt">
  ) => void
  answerQuery: (id: string, answer: string, answeredBy: string) => void
}

/** Hours after which an unanswered query is considered overdue (§9.4). */
export const QUERY_ESCALATION_HOURS = 4

export function isOverdue(query: OrderQuery, now: Date = new Date()): boolean {
  if (query.status !== "open") return false
  const ageMs = now.getTime() - new Date(query.raisedAt).getTime()
  return ageMs > QUERY_ESCALATION_HOURS * 60 * 60 * 1000
}

export const useOrderQueries = create<OrderQueryState>()(
  persist(
    (set) => ({
      queries: [],
      raiseQuery: (input) =>
        set((state) => ({
          queries: [
            {
              ...input,
              id: `QRY-${Date.now()}-${state.queries.length + 1}`,
              raisedAt: new Date().toISOString(),
              status: "open" as const,
            },
            ...state.queries,
          ],
        })),
      // Answering closes the loop. The question itself is never overwritten —
      // the answer is added alongside it (§9.2: addenda, never silent edits).
      answerQuery: (id, answer, answeredBy) =>
        set((state) => ({
          queries: state.queries.map((query) =>
            query.id === id
              ? {
                  ...query,
                  status: "answered" as const,
                  answer,
                  answeredBy,
                  answeredAt: new Date().toISOString(),
                }
              : query
          ),
        })),
    }),
    { name: "folio-order-queries" }
  )
)

/** Every query raised against one order, newest first. */
export function selectQueriesForOrder(queries: OrderQuery[], orderId: string): OrderQuery[] {
  return queries.filter((query) => query.orderId === orderId)
}

export function selectOpenQueries(queries: OrderQuery[]): OrderQuery[] {
  return queries.filter((query) => query.status === "open")
}
