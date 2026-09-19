"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import {
  FlaskConicalIcon,
  Loader2Icon,
  MessageCircleQuestionIcon,
  PlusIcon,
  ScanIcon,
} from "lucide-react"
import { toast } from "sonner"
import type { ServiceRequest } from "@medplum/fhirtypes"
import { PersonAvatar } from "@/components/common/person-avatar"
import { EmptyState } from "@/components/common/empty-state"
import { ListSkeleton } from "@/components/common/loading-skeletons"
import { RoleGate } from "@/components/common/role-gate"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  IMAGING_CATEGORY,
  useOrderQueue,
  usePostResult,
  useReportsForOrders,
} from "@/features/clinical/hooks/use-clinical"
import { QueryOrderDialog } from "@/features/orders/components/query-order-dialog"
import { useQueriesForOrder } from "@/features/orders/lib/order-queries"

/**
 * The performing unit's queue for one order category (laboratory or
 * imaging): pending orders oldest-first, completed orders with their report.
 *
 * Separation of duties: only the PERFORMING role can result an order — the
 * lab scientist for laboratory, the radiographer for imaging (Implementation
 * Manuscript §3, §4.5; §9.5 "orderer != resulter"). The server enforces this
 * too; doctors see the same queue read-only.
 * Resulting a final report completes the order and it moves to the
 * Completed tab; a final report is never edited afterwards.
 */
function OrdersQueue({ category }: { category: string }) {
  const imaging = category === IMAGING_CATEGORY
  const { data: pending, isPending: loadingPending } = useOrderQueue(category, "active")
  const { data: done, isPending: loadingDone } = useOrderQueue(category, "completed")
  const doneIds = useMemo(() => (done ?? []).map((o) => o.id as string), [done])
  const { data: reports } = useReportsForOrders(doneIds)
  const [target, setTarget] = useState<ServiceRequest | null>(null)
  const [querying, setQuerying] = useState<ServiceRequest | null>(null)

  const Icon = imaging ? ScanIcon : FlaskConicalIcon
  /** The role that performs this category — and so may query the order back. */
  const performingRole = imaging ? "radiographer" : "lab-scientist"

  function Row({ order, action }: { order: ServiceRequest; action?: React.ReactNode }) {
    const report = reports?.find((r) => r.basedOn?.some((b) => b.reference === `ServiceRequest/${order.id}`))
    return (
      <div className="flex flex-wrap items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50">
        <span className="w-24 shrink-0 text-xs tabular-nums text-muted-foreground">
          {order.authoredOn ? format(new Date(order.authoredOn), "d MMM HH:mm") : "—"}
        </span>
        <PersonAvatar name={order.subject?.display ?? "Patient"} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {order.subject?.display ?? order.subject?.reference}
            {order.priority && order.priority !== "routine" && (
              <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium uppercase text-destructive">
                {order.priority}
              </span>
            )}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            <Icon className="mr-1 inline size-3.5" />
            {order.code?.text}
            {order.reasonCode?.[0]?.text ? ` · ${order.reasonCode[0].text}` : ""}
            {order.requester?.display ? ` · ordered by ${order.requester.display}` : ""}
          </p>
          {report?.conclusion && <p className="mt-1 whitespace-pre-wrap text-xs text-foreground">{report.conclusion}</p>}
          {report && !report.conclusion && report.result?.length ? (
            <p className="mt-1 text-xs text-muted-foreground">{report.result.length} value(s) reported</p>
          ) : null}
          <OrderQueryThread focusRef={`ServiceRequest/${order.id}`} />
        </div>
        {action}
      </div>
    )
  }

  return (
    <>
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending{pending?.length ? ` (${pending.length})` : ""}</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          {loadingPending ? (
            <ListSkeleton />
          ) : pending === null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Orders are not available for your role.</p>
          ) : !pending?.length ? (
            <EmptyState
              icon={Icon}
              title="No pending orders"
              description={`${imaging ? "Imaging" : "Laboratory"} orders placed by doctors appear here as soon as they are made.`}
            />
          ) : (
            <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-2">
              {(pending ?? []).map((order) => (
                <Row
                  key={order.id}
                  order={order}
                  action={
                    <RoleGate roles={[performingRole]}>
                      <div className="flex items-center gap-2">
                        {/* §4.4: "a two-way channel, not a one-way results
                            pipe" — the performing unit can put the order back
                            to the physician instead of only resulting it. */}
                        <Button variant="outline" size="sm" onClick={() => setQuerying(order)}>
                          <MessageCircleQuestionIcon /> Query
                        </Button>
                        <Button size="sm" onClick={() => setTarget(order)}>
                          <PlusIcon /> {imaging ? "Enter report" : "Enter result"}
                        </Button>
                      </div>
                    </RoleGate>
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="completed">
          {loadingDone ? (
            <ListSkeleton />
          ) : !done?.length ? (
            <EmptyState icon={Icon} title="Nothing completed yet" description="Resulted orders appear here with their report." />
          ) : (
            <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-2">
              {done.map((order) => (
                <Row key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {target && <ResultDialog order={target} imaging={imaging} onClose={() => setTarget(null)} />}

      {querying && (
        <QueryOrderDialog
          open
          onOpenChange={(v) => !v && setQuerying(null)}
          focusRef={`ServiceRequest/${querying.id}`}
          orderLabel={querying.code?.text ?? (imaging ? "Imaging request" : "Laboratory order")}
          patientRef={querying.subject?.reference ?? ""}
          patientName={querying.subject?.display ?? "Patient"}
        />
      )}
    </>
  )
}

/**
 * Questions raised against one order, with the physician's answer once it
 * lands (Manuscript §4.4, §9.4). Shown inline on the order so the loop is
 * visible to whoever is working it — an unanswered query should not be
 * something you have to go looking for.
 */
function OrderQueryThread({ focusRef }: { focusRef: string }) {
  const { data: queries } = useQueriesForOrder(focusRef)
  if (!queries?.length) return null

  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      {queries.map((query) => (
        <div
          key={query.id}
          className="rounded-md border-l-2 border-muted-foreground/30 bg-muted/40 px-2 py-1.5"
        >
          <p className="flex flex-wrap items-center gap-1.5 text-xs text-foreground">
            <MessageCircleQuestionIcon className="size-3.5 shrink-0" aria-hidden="true" />
            {query.question}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {query.raisedBy} · {format(new Date(query.raisedAt), "d MMM HH:mm")}
            {query.status === "open" && " · awaiting the physician"}
          </p>
          {query.status === "answered" && query.answer && (
            <p className="mt-1 border-t border-border pt-1 text-xs text-foreground">
              {query.answer}{" "}
              <span className="text-[11px] text-muted-foreground">— {query.answeredBy}</span>
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

interface ValueRow {
  name: string
  value: string
  unit: string
  flag: string
}

function ResultDialog({ order, imaging, onClose }: { order: ServiceRequest; imaging: boolean; onClose: () => void }) {
  const post = usePostResult()
  const [rows, setRows] = useState<ValueRow[]>(
    imaging ? [] : [{ name: order.code?.text ?? "", value: "", unit: "", flag: "" }]
  )
  const [conclusion, setConclusion] = useState("")
  const [status, setStatus] = useState<"final" | "preliminary">("final")

  async function submit() {
    const observations = rows.filter((r) => r.name.trim() && r.value.trim())
    if (observations.length === 0 && !conclusion.trim()) {
      toast.error(imaging ? "Write the report." : "Enter at least one value.")
      return
    }
    try {
      await post.mutateAsync({
        serviceRequestId: order.id as string,
        observations: observations.map((r) => ({ name: r.name.trim(), value: r.value.trim(), unit: r.unit.trim() || undefined, flag: r.flag || undefined })),
        conclusion: conclusion.trim() || undefined,
        status,
      })
      toast.success(status === "final" ? "Result filed" : "Preliminary result filed", {
        description: `${order.code?.text} for ${order.subject?.display ?? "patient"} — the doctor can see it on the visit.`,
      })
      onClose()
    } catch (error) {
      toast.error("Could not file the result", { description: error instanceof Error ? error.message : "Try again." })
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{imaging ? "Imaging report" : "Laboratory result"}</DialogTitle>
          <DialogDescription>
            {order.code?.text} · {order.subject?.display ?? "patient"}
            {order.requester?.display ? ` · ordered by ${order.requester.display}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {!imaging && (
            <div className="flex flex-col gap-2">
              <Label>Values</Label>
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <Input className="col-span-5" placeholder="Analyte" value={r.name} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <Input className="col-span-3" placeholder="Value" value={r.value} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                  <Input className="col-span-2" placeholder="Unit" value={r.unit} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))} />
                  <Select value={r.flag || "N"} onValueChange={(v) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, flag: v === "N" ? "" : (v ?? "") } : x)))}>
                    <SelectTrigger className="col-span-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="N">Normal</SelectItem>
                      <SelectItem value="H">High</SelectItem>
                      <SelectItem value="L">Low</SelectItem>
                      <SelectItem value="HH">Critical high</SelectItem>
                      <SelectItem value="LL">Critical low</SelectItem>
                      <SelectItem value="A">Abnormal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" className="w-fit text-xs" onClick={() => setRows((rs) => [...rs, { name: "", value: "", unit: "", flag: "" }])}>
                <PlusIcon className="size-3.5" /> Add value
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Label htmlFor="result-conclusion">{imaging ? "Findings & impression" : "Comment / interpretation"}</Label>
            <Textarea id="result-conclusion" rows={imaging ? 8 : 3} value={conclusion} onChange={(e) => setConclusion(e.target.value)} placeholder={imaging ? "Findings…\n\nImpression…" : "Optional"} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus((v as typeof status) ?? "final")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="final">Final — completes the order, cannot be edited</SelectItem>
                <SelectItem value="preliminary">Preliminary — order stays open for the final</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={post.isPending}>
            {post.isPending && <Loader2Icon className="animate-spin" />}
            File {status === "final" ? "final" : "preliminary"} {imaging ? "report" : "result"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { OrdersQueue }
