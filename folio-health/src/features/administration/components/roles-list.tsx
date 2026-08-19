"use client"

import Link from "next/link"
import { ShieldIcon, LockIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { AdministrationModuleTabs } from "./administration-module-tabs"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { useFacilityStaff } from "../hooks/use-facility-staff"
import { FACILITY_ASSIGNABLE_ROLES, ROLE_LABELS, ROLE_ACCESS_POLICY_NAMES, type RoleId } from "@/lib/auth/roles"
import { ROLE_PERMISSIONS, formatPermissionLabel } from "@/lib/auth/permissions"

/** facility-admin plus the seven roles a facility admin can provision (EMR V1 RBAC spec). */
const DISPLAY_ROLES: Exclude<RoleId, "platform-admin">[] = ["facility-admin", ...FACILITY_ASSIGNABLE_ROLES]

function RolesList() {
  const { data: user, isLoading: userLoading } = useCurrentUser()
  const { data: staffData, isLoading: staffLoading } = useFacilityStaff(user?.facilityId ?? null)
  // Distinct from "confirmed zero" — showing "0 users" while the count is
  // still loading reads as a real (and wrong) answer instead of a pending one.
  const countsLoading = userLoading || staffLoading

  function countForRole(role: RoleId) {
    return staffData?.staff.filter((s) => s.role === role).length ?? 0
  }

  return (
    <div>
      <PageHeader
        title="Roles"
        description={`${DISPLAY_ROLES.length} roles defined for Version 1`}
        breadcrumbs={[{ label: "System" }, { label: "Administration" }, { label: "Roles" }]}
      />

      <AdministrationModuleTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DISPLAY_ROLES.map((role) => (
          <Card key={role} className="h-full gap-3">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldIcon className="size-4.5" />
                </div>
                <CardTitle className="text-base">{ROLE_LABELS[role]}</CardTitle>
              </div>
              <StatusBadge
                status={
                  countsLoading
                    ? "Loading…"
                    : `${countForRole(role)} ${countForRole(role) === 1 ? "user" : "users"}`
                }
                tone="blue"
              />
            </CardHeader>
            <CardContent className="flex h-full flex-col gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                {ROLE_PERMISSIONS[role].map((permission) => (
                  <div key={permission} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LockIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
                    {formatPermissionLabel(permission)}
                  </div>
                ))}
              </div>
              <p className="font-mono text-[11px] text-muted-foreground/70">
                Server policy: {ROLE_ACCESS_POLICY_NAMES[role]}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                render={<Link href="/administration/permissions" />}
              >
                View Permission Matrix
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export { RolesList }
