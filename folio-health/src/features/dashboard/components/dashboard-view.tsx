"use client"

import { useSyncExternalStore } from "react"
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
import { FacilityAdminDashboard } from "./facility-admin-dashboard"

/**
 * Dashboard per FACILITY role (EMR V1 RBAC spec §16). The hospital
 * administrator gets an accounts/roles/audit view (§7.8: "clinical content
 * none") — their AccessPolicy grants no Encounter, ServiceRequest or
 * Appointment, so the clinical AdminDashboard would only ever 403 for them.
 * AdminDashboard remains the fallback for an account with no recognised role
 * yet (the permissive provisioning-gap stance in reconcileRoles).
 */
const ROLE_DASHBOARDS: Record<Exclude<RoleId, "platform-admin">, React.ComponentType> = {
  "facility-admin": FacilityAdminDashboard,
  doctor: DoctorDashboard,
  "front-desk": ReceptionistDashboard,
  nurse: NurseDashboard,
  "lab-scientist": LabScientistDashboard,
  pharmacist: PharmacistDashboard,
  "billing-cashier": AccountantDashboard,
  "him-officer": HimOfficerDashboard,
}

/** Never fires — the browser's "today" doesn't change within a page view. */
function emptySubscribe() {
  return () => {}
}

function DashboardView() {
  const previewRole = useUiStore((s) => s.previewRole)
  const { data: user, isLoading } = useCurrentUser()

  // Formatting "today" during render makes the server's HTML disagree with the
  // browser whenever their timezone or locale differs. `useSyncExternalStore`
  // renders the server snapshot (nothing) first and the browser's date after
  // hydration — same effect as a mount effect, without setState-in-effect.
  const today = useSyncExternalStore(
    emptySubscribe,
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    () => null
  )

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
    : effectiveRole
      ? (ROLE_DASHBOARDS[effectiveRole] ?? AdminDashboard)
      : AdminDashboard

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
