"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Task } from "@medplum/fhirtypes"
import { FhirError, createResource, searchResources, updateResource } from "@/lib/fhir/client"

/**
 * Order queries — the flag/query-back channel (Manuscript §4.4, §4.5).
 *
 * The manuscript is specific that a diagnostic or dispensing role can flag or
 * query an order back to the physician ("why is this test being ordered given
 * X") and that this is *a two-way channel, not a one-way results pipe*. §9.4
 * then makes the requirement structural: **every loop must close with an
 * acknowledgement by a named human**, and unclosed loops should escalate on a
 * timer rather than sit silently. §9 adds that a flagged query must be an
 * explicit, tracked loop — not a side conversation.
 *
 * Stored as a FHIR `Task`, which is §4.4's own mapping for "the fulfillment /
 * acknowledgement loop". It was briefly held in localStorage instead, which
 * looked like it worked but never left the browser that raised it — so the
 * physician was promised a query they could not receive. A Task goes to the
 * server, so the person who has to answer actually sees it.
 *
 * Reads and writes go through the FHIR proxy under the caller's own token, so
 * the AccessPolicy decides what is permitted. Following the convention in
 * use-role-dashboards: a 403 returns `null` (render "not available for your
 * role"), never a fabricated empty list.
 */

export const TASK_TYPE_SYSTEM = "https://folio.health/fhir/CodeSystem/task-type"
export const ORDER_QUERY_CODE = "order-query"

/** Hours after which an unanswered query is considered overdue (§9.4). */
export const QUERY_ESCALATION_HOURS = 4

export type OrderKind = "lab" | "imaging" | "medication"

export interface OrderQuery {
  id: string
  /** "ServiceRequest/123" or "MedicationRequest/456". */
  focusRef: string
  orderLabel: string
  patientName: string
  question: string
  raisedBy: string
  raisedAt: string
  status: "open" | "answered"
  answer?: string
  answeredBy?: string
  answeredAt?: string
}

function toOrderQuery(task: Task): OrderQuery {
  // The answer is recorded as a note; the question lives in `description`, so
  // answering never overwrites what was asked (§9.2: addenda, never edits).
  const answerNote = task.note?.[0]
  return {
    id: task.id as string,
    focusRef: task.focus?.reference ?? "",
    orderLabel: task.focus?.display ?? "Order",
    patientName: task.for?.display ?? "Patient",
    question: task.description ?? "",
    raisedBy: task.requester?.display ?? "Unknown",
    raisedAt: task.authoredOn ?? new Date().toISOString(),
    status: task.status === "completed" ? "answered" : "open",
    answer: answerNote?.text,
    answeredBy: answerNote?.authorString,
    answeredAt: answerNote?.time,
  }
}

export function isOverdue(query: OrderQuery, now: Date = new Date()): boolean {
  if (query.status !== "open") return false
  const ageMs = now.getTime() - new Date(query.raisedAt).getTime()
  return ageMs > QUERY_ESCALATION_HOURS * 60 * 60 * 1000
}

/** True when this Task is one of ours, rather than any other Task. */
function isOrderQueryTask(task: Task): boolean {
  return (task.code?.coding ?? []).some(
    (c) => c.system === TASK_TYPE_SYSTEM && c.code === ORDER_QUERY_CODE
  )
}

/**
 * Search order-query Tasks.
 *
 * The filters are sent as search parameters AND re-applied to the result. A
 * FHIR server is free to ignore a parameter it does not implement (the demo
 * store does exactly that), which would otherwise leak unrelated Tasks or
 * already-answered ones into a list that claims to be filtered.
 */
async function searchQueries(
  params: Record<string, string>,
  keep: (q: OrderQuery, t: Task) => boolean
): Promise<OrderQuery[] | null> {
  try {
    const { resources } = await searchResources<Task>("Task", {
      code: `${TASK_TYPE_SYSTEM}|${ORDER_QUERY_CODE}`,
      _count: 100,
      ...params,
    })
    return resources
      .filter(isOrderQueryTask)
      .map((task) => [toOrderQuery(task), task] as const)
      .filter(([query, task]) => keep(query, task))
      .map(([query]) => query)
      .sort((a, b) => b.raisedAt.localeCompare(a.raisedAt))
  } catch (error) {
    // Not granted Task for this role — say so rather than showing "none".
    if (error instanceof FhirError && error.status === 403) return null
    throw error
  }
}

/** Every query raised against one order, newest first. */
export function useQueriesForOrder(focusRef: string | undefined) {
  return useQuery({
    queryKey: ["order-queries", "focus", focusRef ?? "none"],
    enabled: Boolean(focusRef),
    queryFn: () =>
      searchQueries({ focus: focusRef as string }, (query) => query.focusRef === focusRef),
  })
}

/** Every unanswered query — the physician's inbox. */
export function useOpenQueries() {
  return useQuery({
    queryKey: ["order-queries", "open"],
    queryFn: () => searchQueries({ status: "requested" }, (query) => query.status === "open"),
  })
}

export interface RaiseQueryInput {
  focusRef: string
  orderLabel: string
  patientRef: string
  patientName: string
  question: string
  raisedBy: string
}

export function useRaiseQuery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RaiseQueryInput) => {
      const task: Task = {
        resourceType: "Task",
        status: "requested",
        intent: "order",
        priority: "routine",
        code: {
          coding: [{ system: TASK_TYPE_SYSTEM, code: ORDER_QUERY_CODE, display: "Order query" }],
          text: "Order query",
        },
        focus: { reference: input.focusRef, display: input.orderLabel },
        for: { reference: input.patientRef, display: input.patientName },
        authoredOn: new Date().toISOString(),
        // The server should stamp the requester from the session; until the
        // clinical route accepts Tasks, the display carries who asked so the
        // physician knows who to answer (§9.5: stamped with who and when).
        requester: { display: input.raisedBy },
        description: input.question,
      }
      return createResource<Task>(task)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["order-queries"] })
    },
  })
}

export function useAnswerQuery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      answer,
      answeredBy,
    }: {
      id: string
      answer: string
      answeredBy: string
    }) => {
      // Re-read before writing so the answer is added to the current version
      // rather than clobbering a concurrent change.
      const { resources } = await searchResources<Task>("Task", { _id: id })
      const current = resources[0]
      if (!current) throw new Error("This query no longer exists.")

      const updated: Task = {
        ...current,
        status: "completed",
        lastModified: new Date().toISOString(),
        note: [
          {
            text: answer,
            authorString: answeredBy,
            time: new Date().toISOString(),
          },
          ...(current.note ?? []),
        ],
      }
      return updateResource<Task>(updated)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["order-queries"] })
    },
  })
}
