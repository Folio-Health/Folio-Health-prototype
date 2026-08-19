"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ActivityIcon,
  ClipboardListIcon,
  DropletIcon,
  FileTextIcon,
  NotebookPenIcon,
  PaperclipIcon,
  PillIcon,
  ReceiptIcon,
  TriangleAlertIcon,
  UserRoundIcon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { RoleGate } from "@/components/common/role-gate"
import { cn } from "@/lib/utils"
import { APPOINTMENTS } from "@/lib/mock/appointments"
import { getPatientById } from "@/lib/mock/patients"
import { getStaffById } from "@/lib/mock/staff"
import { getLatestVitalsForPatient } from "@/lib/mock/vitals"
import type { VitalsFormValues } from "@/features/vitals/components/vitals-entry-form"
import type {
  AttachmentItem,
  MedicationItem,
  OrderItem,
  SoapNotes,
  WorkspaceSection,
} from "@/features/consultation/types"
import { PatientInfoSection } from "./sections/patient-info-section"
import { VitalsSection } from "./sections/vitals-section"
import { SoapNotesSection } from "./sections/soap-notes-section"
import { OrdersSection } from "./sections/orders-section"
import { MedicationListSection } from "./sections/medication-list-section"
import { ClinicalNotesSection } from "./sections/clinical-notes-section"
import { AttachmentsSection } from "./sections/attachments-section"
import { QuickActionsPanel } from "./quick-actions-panel"
import type { VitalReading } from "@/types/core"

const SECTIONS: { id: WorkspaceSection; label: string; icon: typeof UserRoundIcon }[] = [
  { id: "patient-info", label: "Patient Info", icon: UserRoundIcon },
  { id: "vitals", label: "Vitals", icon: ActivityIcon },
  { id: "soap-notes", label: "SOAP Notes", icon: FileTextIcon },
  { id: "orders", label: "Orders", icon: ClipboardListIcon },
  { id: "medications", label: "Medications", icon: PillIcon },
  { id: "prescription", label: "Prescription", icon: ReceiptIcon },
  { id: "clinical-notes", label: "Clinical Notes", icon: NotebookPenIcon },
  { id: "attachments", label: "Attachments", icon: PaperclipIcon },
]

let localIdCounter = 0
function nextId(prefix: string) {
  localIdCounter += 1
  return `${prefix}-${Date.now()}-${localIdCounter}`
}

function ConsultationWorkspace({ appointmentId }: { appointmentId: string }) {
  const router = useRouter()
  const appointment = APPOINTMENTS.find((a) => a.id === appointmentId)
  const patient = appointment ? getPatientById(appointment.patientId) : undefined
  const consultingDoctor = appointment ? getStaffById(appointment.doctorId) : undefined
  const primaryDoctor = patient ? getStaffById(patient.primaryDoctorId) : undefined

  const [activeSection, setActiveSection] = useState<WorkspaceSection>("patient-info")
  const [soapNotes, setSoapNotes] = useState<SoapNotes>({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  })
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [medications, setMedications] = useState<MedicationItem[]>([])
  const [prescriptions, setPrescriptions] = useState<MedicationItem[]>([])
  const [clinicalNotes, setClinicalNotes] = useState("")
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])
  const [recordedThisVisit, setRecordedThisVisit] = useState<VitalReading | undefined>(undefined)

  if (!appointment || !patient) {
    return (
      <EmptyState
        title="Consultation not found"
        description="This appointment doesn't exist or may have been removed."
        action={
          <Button render={<Link href="/consultation" />} size="sm">
            Back to Consultation
          </Button>
        }
      />
    )
  }

  const latestVitals = recordedThisVisit ?? getLatestVitalsForPatient(patient.id)

  function handleRecordVitals(values: VitalsFormValues) {
    const heightM = values.height / 100
    const reading: VitalReading = {
      id: nextId("VIT-VISIT"),
      patientId: values.patientId,
      recordedAt: new Date().toISOString(),
      recordedBy: consultingDoctor?.name ?? "Attending Physician",
      bpSystolic: values.bpSystolic,
      bpDiastolic: values.bpDiastolic,
      pulse: values.pulse,
      temperature: values.temperature,
      respiratoryRate: values.respiratoryRate,
      spo2: values.spo2,
      weight: values.weight,
      height: values.height,
      bmi: Number((values.weight / (heightM * heightM)).toFixed(1)),
    }
    setRecordedThisVisit(reading)
    toast.success("Vitals recorded for this visit")
  }

  function handleAddOrder(order: Omit<OrderItem, "id" | "createdAt">) {
    setOrders((prev) => [...prev, { ...order, id: nextId("ORD"), createdAt: new Date().toISOString() }])
    toast.success(`${order.name} added to orders`)
  }

  function handleAddAttachments(files: File[]) {
    setAttachments((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: nextId("ATT"),
        name: file.name,
        size: file.size,
        addedAt: new Date().toISOString(),
      })),
    ])
    toast.success(files.length === 1 ? `${files[0].name} attached` : `${files.length} files attached`)
  }

  function handleSaveDraft() {
    toast.success("Draft saved")
  }

  function handleFinalize() {
    toast.success("Visit finalized")
    router.push("/consultation")
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <PageHeader
        title={patient.name}
        breadcrumbs={[
          { label: "Consultation", href: "/consultation" },
          { label: `${patient.name} (${patient.mrn})` },
        ]}
      />

      <Card className="border-primary/20 bg-primary/4">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PersonAvatar name={patient.name} seed={patient.avatarSeed} size="lg" />
            <div className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-heading text-lg font-semibold text-foreground">{patient.name}</p>
                <StatusBadge status={appointment.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {patient.mrn} &middot; {patient.gender}, {patient.age} Years &middot; {appointment.reason}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <DropletIcon className="size-4 text-muted-foreground" />
              <span className="text-foreground">{patient.bloodGroup}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TriangleAlertIcon className="size-4 text-muted-foreground" />
              <span className="text-foreground">
                {patient.allergies.length} {patient.allergies.length === 1 ? "Allergy" : "Allergies"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserRoundIcon className="size-4 text-muted-foreground" />
              <span className="text-foreground">{primaryDoctor?.name ?? "Unassigned"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <nav className="flex flex-row flex-wrap gap-1 lg:col-span-2 lg:flex-col lg:flex-nowrap">
          {SECTIONS.map((section) => {
            const isActive = section.id === activeSection
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-foreground/80 transition-colors hover:bg-muted",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary"
                )}
              >
                <section.icon className="size-[18px] shrink-0" />
                <span className="truncate">{section.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="lg:col-span-7">
          {activeSection === "patient-info" && (
            <PatientInfoSection patient={patient} doctor={primaryDoctor} />
          )}
          {activeSection === "vitals" && (
            <VitalsSection patient={patient} latestVitals={latestVitals} onRecord={handleRecordVitals} />
          )}
          {activeSection === "soap-notes" && (
            <SoapNotesSection notes={soapNotes} onChange={setSoapNotes} />
          )}
          {activeSection === "orders" && (
            <OrdersSection
              orders={orders}
              onAdd={handleAddOrder}
              onRemove={(id) => setOrders((prev) => prev.filter((o) => o.id !== id))}
            />
          )}
          {activeSection === "medications" && (
            <MedicationListSection
              title="Medications"
              description="Medications administered during this visit"
              medications={medications}
              onAdd={(med) => {
                setMedications((prev) => [...prev, { ...med, id: nextId("MED") }])
                toast.success(`${med.drugName} added to medications`)
              }}
              onRemove={(id) => setMedications((prev) => prev.filter((m) => m.id !== id))}
            />
          )}
          {activeSection === "prescription" && (
            <MedicationListSection
              title="Prescription"
              description="Take home prescription for the patient"
              medications={prescriptions}
              onAdd={(med) => {
                setPrescriptions((prev) => [...prev, { ...med, id: nextId("RX") }])
                toast.success(`${med.drugName} added to prescription`)
              }}
              onRemove={(id) => setPrescriptions((prev) => prev.filter((m) => m.id !== id))}
            />
          )}
          {activeSection === "clinical-notes" && (
            <ClinicalNotesSection notes={clinicalNotes} onChange={setClinicalNotes} />
          )}
          {activeSection === "attachments" && (
            <AttachmentsSection
              attachments={attachments}
              onAdd={handleAddAttachments}
              onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
            />
          )}
        </div>

        <div className="lg:col-span-3">
          <QuickActionsPanel onNavigate={setActiveSection} />
        </div>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:justify-end">
        <RoleGate roles={["doctor"]}>
          <Button variant="outline" onClick={handleSaveDraft}>
            Save Draft
          </Button>
        </RoleGate>
        <RoleGate roles={["doctor"]}>
          <Button onClick={handleFinalize}>Finalize Visit</Button>
        </RoleGate>
      </div>
    </div>
  )
}

export { ConsultationWorkspace }
