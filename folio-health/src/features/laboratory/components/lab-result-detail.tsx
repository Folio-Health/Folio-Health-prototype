"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  PrinterIcon,
  MessageCircleQuestionIcon,
  CheckCircleIcon,
  UserRoundIcon,
  FlaskConicalIcon,
  CalendarClockIcon,
  ClipboardCheckIcon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { RoleGate } from "@/components/common/role-gate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { getLabResultById } from "@/lib/mock/laboratory"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { useUiStore } from "@/stores/ui-store"
import { getSnapshotSections } from "@/features/patients/lib/patient-tabs-access"
import { buildEncounterSnapshot } from "@/features/clinical-snapshot/lib/build-snapshot"
import { ClinicalSnapshot } from "@/features/clinical-snapshot/components/clinical-snapshot"
import { QueryOrderDialog } from "@/features/orders/components/query-order-dialog"
import { useOrderQueries } from "@/features/orders/lib/order-queries"

function InfoRow({ icon: Icon, label, value }: { icon: typeof UserRoundIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm text-foreground">{value}</span>
      </div>
    </div>
  )
}

function LabResultDetail({ resultId }: { resultId: string }) {
  const result = getLabResultById(resultId)
  const [locallyApproved, setLocallyApproved] = useState(false)
  const [queryOpen, setQueryOpen] = useState(false)

  const { data: user } = useCurrentUser()
  const previewRole = useUiStore((s) => s.previewRole)
  const roles = previewRole ? [previewRole] : (user?.roles ?? [])
  const snapshotSections = getSnapshotSections(roles)

  const queries = useOrderQueries((s) => s.queries).filter((q) => q.orderId === resultId)

  if (!result) {
    return (
      <EmptyState
        icon={FlaskConicalIcon}
        title="Lab result not found"
        description="This lab order doesn't exist or may have been removed."
        action={
          <Button render={<Link href="/laboratory" />} size="sm">
            Back to Laboratory
          </Button>
        }
      />
    )
  }

  const patient = getPatientById(result.patientId)
  const doctor = getStaffById(result.doctorId)
  const scientist = result.collectedBy ? getStaffById(result.collectedBy) : undefined
  const isApproved = result.workflowStatus === "Approved" || locallyApproved
  const canApprove = result.workflowStatus === "Completed" && !locallyApproved

  return (
    <div>
      <PageHeader
        title={result.testName}
        description={`Test ID ${result.id}`}
        breadcrumbs={[
          { label: "Diagnostics" },
          { label: "Laboratory", href: "/laboratory" },
          { label: result.id },
        ]}
        actions={
          <>
            <RoleGate permission="ORDER_QUERY">
              <Button variant="outline" onClick={() => setQueryOpen(true)}>
                <MessageCircleQuestionIcon />
                Query order
              </Button>
            </RoleGate>
            <Button variant="outline" onClick={() => window.print()}>
              <PrinterIcon />
              Print Result
            </Button>
            {isApproved ? (
              <Button disabled variant="outline">
                <CheckCircleIcon />
                Approved
              </Button>
            ) : (
              <RoleGate permission="LAB_RELEASE_RESULT">
                <Button disabled={!canApprove} onClick={() => setLocallyApproved(true)}>
                  <CheckCircleIcon />
                  Approve Result
                </Button>
              </RoleGate>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-1">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 text-center">
              {patient ? (
                <>
                  <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="lg" className="size-16" />
                  <div>
                    <Link href={`/patients/${patient.id}`} className="font-heading text-base font-semibold text-foreground hover:text-primary hover:underline">
                      {patient.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {patient.gender}, {patient.age} Years &middot; {patient.mrn}
                    </p>
                  </div>
                  <StatusBadge status={patient.bloodGroup} tone="red" />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Unknown patient</p>
              )}
            </CardContent>
          </Card>

          {/* §4.4: the lab scientist works from a snapshot — the reason for
              the test and the relevant presenting complaint — never the
              physician's full record. */}
          {patient && snapshotSections.length > 0 && (() => {
            const snapshot = buildEncounterSnapshot(patient.id, result.clinicalIndication, snapshotSections)
            return snapshot ? (
              <ClinicalSnapshot snapshot={snapshot} sections={snapshotSections} />
            ) : null
          })()}

          {queries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Queries on this order</CardTitle>
                <CardDescription>
                  Raised back to the ordering physician. The loop stays open until answered.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {queries.map((query) => (
                  <div key={query.id} className="flex flex-col gap-1 rounded-lg border border-border p-3">
                    <p className="text-sm text-foreground">{query.question}</p>
                    <p className="text-xs text-muted-foreground">
                      {query.raisedBy} &middot;{" "}
                      {format(new Date(query.raisedAt), "d MMM yyyy, h:mm a")}
                    </p>
                    {query.status === "answered" ? (
                      <div className="mt-1 rounded-md bg-muted/60 p-2">
                        <p className="text-sm text-foreground">{query.answer}</p>
                        <p className="text-xs text-muted-foreground">
                          Answered by {query.answeredBy}
                        </p>
                      </div>
                    ) : (
                      <StatusBadge status="Pending" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <InfoRow icon={UserRoundIcon} label="Ordering Doctor" value={doctor?.name ?? "Unassigned"} />
              <InfoRow icon={FlaskConicalIcon} label="Test Type" value={result.testType} />
              <InfoRow
                icon={ClipboardCheckIcon}
                label="Reason for test"
                value={result.clinicalIndication || "No indication recorded"}
              />
              <InfoRow
                icon={CalendarClockIcon}
                label="Ordered At"
                value={format(new Date(result.orderedAt), "MMM d, yyyy h:mm a")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sample Collection</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <InfoRow
                icon={ClipboardCheckIcon}
                label="Collected By"
                value={scientist?.name ?? "Not yet collected"}
              />
              <InfoRow
                icon={CalendarClockIcon}
                label="Collected At"
                value={result.collectedAt ? format(new Date(result.collectedAt), "MMM d, yyyy h:mm a") : "Pending collection"}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {result.parameters.length > 0
                  ? `${result.parameters.length} parameter${result.parameters.length > 1 ? "s" : ""} reported`
                  : "Results not yet available"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.parameters.length === 0 ? (
                <EmptyState
                  icon={FlaskConicalIcon}
                  title="Awaiting results"
                  description="This test hasn't been resulted by the laboratory yet."
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="h-11 px-4">Parameter</TableHead>
                        <TableHead className="h-11 px-4">Result</TableHead>
                        <TableHead className="h-11 px-4">Reference Range</TableHead>
                        <TableHead className="h-11 px-4">Flag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.parameters.map((p) => (
                        <TableRow key={p.parameter}>
                          <TableCell className="px-4 py-3 font-medium text-foreground">{p.parameter}</TableCell>
                          <TableCell className="px-4 py-3 tabular-nums text-foreground">{p.result}</TableCell>
                          <TableCell className="px-4 py-3 tabular-nums text-muted-foreground">
                            {p.referenceRange}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <StatusBadge status={p.flag} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {result.comments && (
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{result.comments}</p>
              </CardContent>
            </Card>
          )}

          {result.approvedBy && (
            <Card>
              <CardHeader>
                <CardTitle>Approval</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <InfoRow icon={UserRoundIcon} label="Approved By" value={result.approvedBy} />
                {result.approvedAt && (
                  <InfoRow
                    icon={CalendarClockIcon}
                    label="Approved At"
                    value={format(new Date(result.approvedAt), "MMM d, yyyy h:mm a")}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {patient && (
        <QueryOrderDialog
          open={queryOpen}
          onOpenChange={setQueryOpen}
          orderId={result.id}
          orderKind="lab"
          orderLabel={result.testName}
          patientId={patient.id}
          patientName={patient.name}
        />
      )}
    </div>
  )
}

export { LabResultDetail }
