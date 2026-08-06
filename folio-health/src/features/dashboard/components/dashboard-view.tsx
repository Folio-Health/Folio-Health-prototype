"use client"

import { useEffect, useState } from "react"
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

  // Formatting "today" during render makes the server's HTML disagree with the
  // browser whenever their timezone or locale differs. Resolve it after mount
  // so both render the same thing first.
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    )
  }, [])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={today ? `${activeRole} overview for ${today}` : `${activeRole} overview`}
      />
      <DashboardComponent />
    </div>
  )
}

export { DashboardView }
