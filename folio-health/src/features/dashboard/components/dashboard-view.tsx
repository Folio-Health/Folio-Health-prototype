"use client"

import { PageHeader } from "@/components/common/page-header"
import { useUiStore } from "@/stores/ui-store"
import { AdminDashboard } from "./admin-dashboard"
import { DoctorDashboard } from "./doctor-dashboard"
import { ReceptionistDashboard } from "./receptionist-dashboard"
import { NurseDashboard } from "./nurse-dashboard"
import { LabScientistDashboard } from "./lab-scientist-dashboard"
import { RadiologistDashboard } from "./radiologist-dashboard"
import { PharmacistDashboard } from "./pharmacist-dashboard"
import { AccountantDashboard } from "./accountant-dashboard"
import { HospitalManagementDashboard } from "./hospital-management-dashboard"
import type { ClinicalRole } from "@/types/core"

const ROLE_DASHBOARDS: Record<ClinicalRole, React.ComponentType> = {
  Administrator: AdminDashboard,
  Doctor: DoctorDashboard,
  Receptionist: ReceptionistDashboard,
  Nurse: NurseDashboard,
  "Lab Scientist": LabScientistDashboard,
  Radiologist: RadiologistDashboard,
  Pharmacist: PharmacistDashboard,
  Accountant: AccountantDashboard,
  "Hospital Management": HospitalManagementDashboard,
}

function DashboardView() {
  const activeRole = useUiStore((s) => s.activeRole)
  const DashboardComponent = ROLE_DASHBOARDS[activeRole] ?? AdminDashboard

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`${activeRole} overview for ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
      />
      <DashboardComponent />
    </div>
  )
}

export { DashboardView }
