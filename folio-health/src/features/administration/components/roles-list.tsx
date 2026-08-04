"use client"

import Link from "next/link"
import { ShieldIcon, LockIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { AdministrationModuleTabs } from "./administration-module-tabs"
import { STAFF } from "@/lib/mock/staff"
import { CLINICAL_ROLES } from "@/types/core"
import type { ClinicalRole } from "@/types/core"

const ROLE_PERMISSIONS: Record<ClinicalRole, string[]> = {
  Administrator: ["Full system access", "Manage users & roles", "System configuration"],
  Receptionist: ["Register patients", "Schedule appointments", "View front desk queue"],
  Doctor: ["View & edit patient records", "Write prescriptions", "Order lab/radiology tests"],
  Nurse: ["Record vitals", "Administer medication", "Update care plans"],
  "Lab Scientist": ["Process lab orders", "Enter test results", "Manage lab inventory"],
  Radiologist: ["Review imaging studies", "Publish radiology reports", "Manage scan schedule"],
  Pharmacist: ["Dispense medication", "Manage drug inventory", "Review prescriptions"],
  Accountant: ["Manage invoices", "Process payments", "View financial reports"],
  "Hospital Management": ["View analytics", "Approve budgets", "Full oversight access"],
}

function RolesList() {
  return (
    <div>
      <PageHeader
        title="Roles"
        description={`${CLINICAL_ROLES.length} roles defined across the system`}
        breadcrumbs={[{ label: "System" }, { label: "Administration" }, { label: "Roles" }]}
      />

      <AdministrationModuleTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CLINICAL_ROLES.map((role) => {
          const userCount = STAFF.filter((s) => s.role === role).length
          return (
            <Card key={role} className="gap-3">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldIcon className="size-4.5" />
                  </div>
                  <CardTitle className="text-base">{role}</CardTitle>
                </div>
                <StatusBadge status={`${userCount} users`} tone="blue" />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  {ROLE_PERMISSIONS[role].map((perm) => (
                    <div key={perm} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LockIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
                      {perm}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  render={<Link href="/administration/permissions" />}
                >
                  Manage Permissions
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export { RolesList }
