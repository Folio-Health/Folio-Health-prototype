"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/common/page-header"
import { useUiStore } from "@/stores/ui-store"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { ROLE_LABELS, type RoleId } from "@/lib/auth/roles"
import { ListSkeleton } from "@/components/common/loading-skeletons"
import { AdminDashboard } from "./admin-dashboard"
import { PlatformDashboard } from "./platform-dashboard"
import { DoctorDashboard } from "./doctor-dashboard"
import { ReceptionistDashboard } from "./receptionist-dashboard"
import { NurseDashboard } from "./nurse-dashboard"
import { LabScientistDashboard } from "./lab-scientist-dashboard"
import { PharmacistDashboard } from "./pharmacist-dashboard"
import { AccountantDashboard } from "./accountant-dashboard"
import { HimOfficerDashboard } from "./him-officer-dashboard"

/**
 * Dashboard per FACILITY role (EMR V1 RBAC spec §16). `facility-admin` falls
 * back to AdminDashboard — the two roles largely overlap (administrative
 * oversight of one facility vs. the whole system).
 */
const ROLE_DASHBOARDS: Record<Exclude<RoleId, "platform-admin">, React.ComponentType> = {
  "facility-admin": AdminDashboard,
  doctor: DoctorDashboard,
  "front-desk": ReceptionistDashboard,
  nurse: NurseDashboard,
  "lab-scientist": LabScientistDashboard,
  pharmacist: PharmacistDashboard,
  "billing-cashier": AccountantDashboard,
  "him-officer": HimOfficerDashboard,
}

function DashboardView() {
  const previewRole = useUiStore((s) => s.previewRole)
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

  // The operator plane gets the platform overview — never a clinical dashboard.
  const isPlatform = user?.platformOnly ?? false

  // Real role first; "preview as role" only overrides which dashboard renders,
  // never what data loads underneath it. A user can hold more than one role —
  // pick the first for dashboard purposes, since only one view can render.
  const realRole = user?.roles.find((r): r is Exclude<RoleId, "platform-admin"> => r !== "platform-admin")
  const effectiveRole = previewRole ?? realRole

  const DashboardComponent = isPlatform
    ? PlatformDashboard
    : (ROLE_DASHBOARDS[effectiveRole ?? "facility-admin"] ?? AdminDashboard)

  const roleLabel = isPlatform
    ? ROLE_LABELS["platform-admin"]
    : previewRole
      ? ROLE_LABELS[previewRole]
      : (user?.roles.map((r) => ROLE_LABELS[r]).join(" · ") ?? "")

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
