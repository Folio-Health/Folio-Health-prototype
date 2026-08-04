"use client"

import { useState } from "react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdministrationModuleTabs } from "./administration-module-tabs"
import { CLINICAL_ROLES } from "@/types/core"
import type { ClinicalRole } from "@/types/core"

interface PermissionCategory {
  category: string
  actions: string[]
}

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  { category: "Patients", actions: ["View", "Create", "Edit", "Delete"] },
  { category: "Billing", actions: ["View", "Create", "Edit", "Delete"] },
  { category: "Reports", actions: ["View", "Export"] },
  { category: "Settings", actions: ["View", "Edit"] },
]

const ROLE_ACCESS: Record<ClinicalRole, Record<string, string[]>> = {
  Administrator: {
    Patients: ["View", "Create", "Edit", "Delete"],
    Billing: ["View", "Create", "Edit", "Delete"],
    Reports: ["View", "Export"],
    Settings: ["View", "Edit"],
  },
  "Hospital Management": {
    Patients: ["View"],
    Billing: ["View", "Create", "Edit"],
    Reports: ["View", "Export"],
    Settings: ["View"],
  },
  Doctor: {
    Patients: ["View", "Create", "Edit", "Delete"],
    Billing: ["View"],
    Reports: ["View"],
    Settings: [],
  },
  Nurse: {
    Patients: ["View", "Edit"],
    Billing: [],
    Reports: ["View"],
    Settings: [],
  },
  "Lab Scientist": {
    Patients: ["View"],
    Billing: [],
    Reports: ["View"],
    Settings: [],
  },
  Radiologist: {
    Patients: ["View"],
    Billing: [],
    Reports: ["View"],
    Settings: [],
  },
  Pharmacist: {
    Patients: ["View"],
    Billing: ["View"],
    Reports: ["View"],
    Settings: [],
  },
  Receptionist: {
    Patients: ["View", "Create", "Edit"],
    Billing: ["View", "Create"],
    Reports: [],
    Settings: [],
  },
  Accountant: {
    Patients: ["View"],
    Billing: ["View", "Create", "Edit", "Delete"],
    Reports: ["View", "Export"],
    Settings: [],
  },
}

function permKey(category: string, action: string) {
  return `${category}:${action}`
}

function buildInitialState(): Record<ClinicalRole, Record<string, boolean>> {
  const state = {} as Record<ClinicalRole, Record<string, boolean>>
  for (const role of CLINICAL_ROLES) {
    const grants: Record<string, boolean> = {}
    for (const { category, actions } of PERMISSION_CATEGORIES) {
      for (const action of actions) {
        grants[permKey(category, action)] = ROLE_ACCESS[role][category]?.includes(action) ?? false
      }
    }
    state[role] = grants
  }
  return state
}

function PermissionsMatrix() {
  const [matrix, setMatrix] = useState(buildInitialState)

  function toggle(role: ClinicalRole, key: string) {
    setMatrix((prev) => ({
      ...prev,
      [role]: { ...prev[role], [key]: !prev[role][key] },
    }))
  }

  return (
    <div>
      <PageHeader
        title="Permission Matrix"
        description="Illustrative access control per role, toggles are local only and don't persist"
        breadcrumbs={[{ label: "System" }, { label: "Administration" }, { label: "Permissions" }]}
      />

      <AdministrationModuleTabs />

      <Card>
        <CardHeader>
          <CardTitle>Permissions by Role</CardTitle>
          <CardDescription>Toggle a switch to grant or revoke a permission for a role.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-11 min-w-48 px-4">Permission</TableHead>
                  {CLINICAL_ROLES.map((role) => (
                    <TableHead key={role} className="h-11 min-w-28 px-3 text-center whitespace-nowrap">
                      {role}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSION_CATEGORIES.map(({ category, actions }) =>
                  actions.map((action, actionIdx) => {
                    const key = permKey(category, action)
                    return (
                      <TableRow key={key}>
                        <TableCell className="px-4 py-2.5">
                          {actionIdx === 0 && (
                            <span className="mr-2 text-xs font-semibold tracking-wide text-foreground uppercase">
                              {category}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">{action}</span>
                        </TableCell>
                        {CLINICAL_ROLES.map((role) => (
                          <TableCell key={role} className="px-3 py-2.5 text-center">
                            <Switch
                              size="sm"
                              checked={matrix[role][key]}
                              onCheckedChange={() => toggle(role, key)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { PermissionsMatrix }
