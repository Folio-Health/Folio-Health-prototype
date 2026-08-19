"use client"

import { CheckIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdministrationModuleTabs } from "./administration-module-tabs"
import { FACILITY_ASSIGNABLE_ROLES, ROLE_LABELS, type RoleId } from "@/lib/auth/roles"
import { ALL_PERMISSIONS, ROLE_PERMISSIONS, formatPermissionLabel } from "@/lib/auth/permissions"

const DISPLAY_ROLES: Exclude<RoleId, "platform-admin">[] = ["facility-admin", ...FACILITY_ASSIGNABLE_ROLES]

/**
 * Read-only reflection of `src/lib/auth/permissions.ts` — what's actually
 * compiled into the app, not an editable settings page. Permissions are
 * defined in code, not a database, so there is nothing here to persist; the
 * previous version of this page had toggles that looked editable but did
 * nothing, which is worse than no controls at all. Changing a grant means
 * changing that file (and the matching server-side AccessPolicy) and
 * shipping a release, not clicking a switch.
 */
function PermissionsMatrix() {
  return (
    <div>
      <PageHeader
        title="Permission Matrix"
        description="What each role is granted in this build — defined in code, not editable here"
        breadcrumbs={[{ label: "System" }, { label: "Administration" }, { label: "Permissions" }]}
      />

      <AdministrationModuleTabs />

      <Card>
        <CardHeader>
          <CardTitle>Permissions by Role</CardTitle>
          <CardDescription>
            A checkmark means the role holds that permission in the current release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            {/* min-w forces genuine overflow so the wrapper's scrollbar
                engages — table-layout:auto otherwise shrinks columns below
                their min-w-* hint to fit the viewport instead of scrolling,
                silently hiding the last 1-2 role columns entirely. */}
            <Table className="min-w-[1040px]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  {/* Sticky so the permission name stays visible while
                      scrolling to reach the later role columns — otherwise a
                      checkmark far to the right is unreadable on its own. */}
                  <TableHead className="sticky left-0 z-10 h-11 min-w-48 border-r border-border bg-muted/40 px-4 shadow-[2px_0_4px_-2px_rgb(0_0_0/0.1)]">
                    Permission
                  </TableHead>
                  {DISPLAY_ROLES.map((role) => (
                    <TableHead key={role} className="h-11 min-w-28 px-3 text-center whitespace-nowrap">
                      {ROLE_LABELS[role]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_PERMISSIONS.map((permission) => (
                  <TableRow key={permission}>
                    <TableCell className="sticky left-0 z-10 border-r border-border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-[2px_0_4px_-2px_rgb(0_0_0/0.1)]">
                      {formatPermissionLabel(permission)}
                    </TableCell>
                    {DISPLAY_ROLES.map((role) => {
                      const granted = ROLE_PERMISSIONS[role].includes(permission)
                      return (
                        <TableCell key={role} className="px-3 py-2.5 text-center">
                          {granted && <CheckIcon className="mx-auto size-4 text-primary" />}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { PermissionsMatrix }
