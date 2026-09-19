"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import {
  ZoomInIcon,
  ZoomOutIcon,
  RotateCwIcon,
  RefreshCcwIcon,
  DownloadIcon,
  ScanIcon,
  UserRoundIcon,
  CalendarClockIcon,
  MessageCircleQuestionIcon,
  UploadIcon,
  CheckIcon,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { getImagingRequestById, getReportForRequest } from "@/lib/mock/radiology"
import { getPatientById } from "@/lib/mock/patients"
import { RoleGate } from "@/components/common/role-gate"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { useUiStore } from "@/stores/ui-store"
import { getSnapshotSections } from "@/features/patients/lib/patient-tabs-access"
import { buildEncounterSnapshot } from "@/features/clinical-snapshot/lib/build-snapshot"
import { ClinicalSnapshot } from "@/features/clinical-snapshot/components/clinical-snapshot"
import { QueryOrderDialog } from "@/features/orders/components/query-order-dialog"
import { useOrderQueries } from "@/features/orders/lib/order-queries"
import { getStaffById } from "@/lib/mock/staff"
import { unsplash, MEDICAL_IMAGES } from "@/lib/images"
import { cn } from "@/lib/utils"

const ZOOM_STEP = 25
const MIN_ZOOM = 50
const MAX_ZOOM = 200

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

function RadiologyViewer({ requestId }: { requestId: string }) {
  const request = getImagingRequestById(requestId)
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [queryOpen, setQueryOpen] = useState(false)

  // §4.5: the radiographer uploads imaging findings to a portal the physician
  // then views. Held locally here — persisting a DiagnosticReport is the
  // backend half of this.
  const [uploading, setUploading] = useState(false)
  const [draftFindings, setDraftFindings] = useState("")
  const [draftConclusion, setDraftConclusion] = useState("")
  const [uploadedAt, setUploadedAt] = useState<string | null>(null)

  const { data: user } = useCurrentUser()
  const previewRole = useUiStore((s) => s.previewRole)
  const roles = previewRole ? [previewRole] : (user?.roles ?? [])
  const snapshotSections = getSnapshotSections(roles)
  const queries = useOrderQueries((s) => s.queries).filter((q) => q.orderId === requestId)

  if (!request) {
    return (
      <EmptyState
        icon={ScanIcon}
        title="Imaging study not found"
        description="This radiology request doesn't exist or may have been removed."
        action={
          <Button render={<Link href="/radiology" />} size="sm">
            Back to Radiology
          </Button>
        }
      />
    )
  }

  const patient = getPatientById(request.patientId)
  const radiologist = getStaffById(request.radiologistId)
  const report = getReportForRequest(request.id)
  const imageIds = request.imageIds.length > 0 ? request.imageIds : [MEDICAL_IMAGES.radiology[0]]
  const activeImage = imageIds[activeIndex] ?? imageIds[0]

  function handleDownloadReport() {
    if (!report) return
    const content = [
      `Examination: ${report.examination}`,
      `Date: ${format(new Date(report.date), "MMM d, yyyy")}`,
      `Patient: ${patient?.name ?? "Unknown"}`,
      `Radiologist: ${radiologist?.name ?? "Unassigned"}`,
      "",
      "Findings:",
      report.findings,
      "",
      "Conclusion:",
      report.conclusion,
    ].join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${report.id}-report.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title={`${request.modality}, ${request.bodyPart}`}
        breadcrumbs={[
          { label: "Radiology", href: "/radiology" },
          { label: patient?.name ?? "Unknown Patient" },
          { label: request.modality },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={request.status} className="h-7 px-3" />
            <RoleGate permission="ORDER_QUERY">
              <Button variant="outline" size="sm" onClick={() => setQueryOpen(true)}>
                <MessageCircleQuestionIcon />
                Query order
              </Button>
            </RoleGate>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[96px_1fr_360px]">
        {/* Thumbnail strip */}
        <div className="flex gap-2 overflow-x-auto xl:flex-col xl:overflow-visible">
          {imageIds.map((imgId, i) => (
            <button
              key={`${imgId}-${i}`}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative size-20 shrink-0 overflow-hidden rounded-lg ring-1 ring-foreground/10 transition-all",
                i === activeIndex ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={unsplash(imgId, { w: 160, h: 160, q: 60 })}
                alt={`${request.modality} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>

        {/* Main viewer */}
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col gap-3 px-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-2 py-1.5">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
                >
                  <ZoomOutIcon />
                </Button>
                <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
                >
                  <ZoomInIcon />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setRotation((r) => (r + 90) % 360)}>
                  <RotateCwIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setZoom(100)
                    setRotation(0)
                  }}
                >
                  <RefreshCcwIcon />
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                Image {activeIndex + 1} of {imageIds.length}
              </span>
            </div>

            <div className="relative flex h-[520px] items-center justify-center overflow-hidden rounded-lg bg-black">
              <div
                className="relative h-full w-full transition-transform duration-200"
                style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
              >
                <Image
                  src={unsplash(activeImage, { w: 1200, q: 75 })}
                  alt={`${request.modality} - ${request.bodyPart}`}
                  fill
                  className="object-contain"
                  unoptimized
                  priority
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report panel */}
        <div className="flex flex-col gap-4">
          {/* §4.5: "same snapshot model as lab" — the radiographer is told why
              the study was requested, not handed the physician's notes. */}
          {patient && snapshotSections.length > 0 && (() => {
            const snapshot = buildEncounterSnapshot(patient.id, request.clinicalIndication, snapshotSections)
            return snapshot ? (
              <ClinicalSnapshot snapshot={snapshot} sections={snapshotSections} />
            ) : null
          })()}

          {queries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Queries on this order</CardTitle>
                <CardDescription>
                  Raised back to the requesting physician. The loop stays open until answered.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {queries.map((query) => (
                  <div key={query.id} className="flex flex-col gap-1 rounded-lg border border-border p-3">
                    <p className="text-sm text-foreground">{query.question}</p>
                    <p className="text-xs text-muted-foreground">
                      {query.raisedBy} &middot; {format(new Date(query.raisedAt), "d MMM yyyy, h:mm a")}
                    </p>
                    {query.status === "answered" ? (
                      <div className="mt-1 rounded-md bg-muted/60 p-2">
                        <p className="text-sm text-foreground">{query.answer}</p>
                        <p className="text-xs text-muted-foreground">Answered by {query.answeredBy}</p>
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
            <CardContent className="flex flex-col gap-3">
              <InfoRow icon={UserRoundIcon} label="Patient" value={patient?.name ?? "Unknown"} />
              <InfoRow
                icon={CalendarClockIcon}
                label="Ordered"
                value={format(new Date(request.orderedAt), "MMM d, yyyy h:mm a")}
              />
              <InfoRow icon={UserRoundIcon} label="Requested By" value={getStaffById(request.doctorId)?.name ?? "Unassigned"} />
              <InfoRow icon={ScanIcon} label="Clinical Indication" value={request.clinicalIndication} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report</CardTitle>
              <CardDescription>
                {report ? report.status : "Not yet reported"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!report ? (
                uploadedAt ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Findings</span>
                      <p className="text-sm text-foreground">{draftFindings}</p>
                    </div>
                    {draftConclusion && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Conclusion</span>
                        <p className="text-sm text-foreground">{draftConclusion}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Uploaded by {user?.name ?? "you"} on{" "}
                      {format(new Date(uploadedAt), "d MMM yyyy, h:mm a")}. The requesting physician
                      can now see this.
                    </p>
                  </div>
                ) : uploading ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="imaging-findings">Findings</Label>
                      <Textarea
                        id="imaging-findings"
                        rows={4}
                        autoFocus
                        placeholder="What the study shows…"
                        value={draftFindings}
                        onChange={(e) => setDraftFindings(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="imaging-conclusion">Conclusion</Label>
                      <Textarea
                        id="imaging-conclusion"
                        rows={2}
                        placeholder="Impression, and anything that needs urgent attention"
                        value={draftConclusion}
                        onChange={(e) => setDraftConclusion(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setUploading(false)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!draftFindings.trim()) {
                            toast.error("Record what the study shows before uploading")
                            return
                          }
                          setUploadedAt(new Date().toISOString())
                          setUploading(false)
                          toast.success("Findings uploaded", {
                            description: "The requesting physician can now see them.",
                          })
                        }}
                      >
                        <CheckIcon />
                        Upload findings
                      </Button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={ScanIcon}
                    title="No findings uploaded yet"
                    description="Once imaging is captured, upload the findings here for the requesting physician."
                    className="py-10"
                    action={
                      <RoleGate permission="IMAGING_UPLOAD_FINDING">
                        <Button size="sm" onClick={() => setUploading(true)}>
                          <UploadIcon />
                          Upload findings
                        </Button>
                      </RoleGate>
                    }
                  />
                )
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Examination</span>
                    <span className="text-sm text-foreground">{report.examination}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Date</span>
                    <span className="text-sm text-foreground">{format(new Date(report.date), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Findings</span>
                    <p className="text-sm text-foreground">{report.findings}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Conclusion</span>
                    <p className="text-sm text-foreground">{report.conclusion}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Radiologist</span>
                    <span className="text-sm text-foreground">{radiologist?.name ?? "Unassigned"}</span>
                  </div>
                  <Button className="mt-1" onClick={handleDownloadReport}>
                    <DownloadIcon />
                    Download Report
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {patient && (
        <QueryOrderDialog
          open={queryOpen}
          onOpenChange={setQueryOpen}
          orderId={request.id}
          orderKind="imaging"
          orderLabel={`${request.modality} — ${request.bodyPart}`}
          patientId={patient.id}
          patientName={patient.name}
        />
      )}
    </div>
  )
}

export { RadiologyViewer }
