"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/common/page-header"
import { useUiStore } from "@/stores/ui-store"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { ROLE_LABELS } from "@/lib/auth/roles"
import { ListSkeleton } from "@/components/common/loading-skeletons"
import { AdminDashboard } from "./admin-dashboard"
import { PlatformDashboard } from "./platform-dashboard"
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
  const { data: user, isLoading } = useCurrentUser()

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

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <ListSkeleton />
      </div>
    )
  }

  // The operator plane gets the platform overview — never a clinical dashboard,
  // and never the local role switcher, which is a demo affordance with no
  // bearing on what the server will actually authorise.
  const isPlatform = user?.platformOnly ?? false
  const DashboardComponent = isPlatform
    ? PlatformDashboard
    : (ROLE_DASHBOARDS[activeRole] ?? AdminDashboard)

  const roleLabel = isPlatform
    ? ROLE_LABELS["platform-admin"]
    : (user?.roles.map((r) => ROLE_LABELS[r]).join(" · ") || activeRole)

  const scope = isPlatform ? "Platform" : (user?.facilityName ?? roleLabel)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={today ? `${scope} overview for ${today}` : `${scope} overview`}
      />
      <DashboardComponent />
    </div>
  )
}

export { DashboardView }
