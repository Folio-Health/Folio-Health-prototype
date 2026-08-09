"use client"

import { useMemo, useState } from "react"
import {
  KeyRoundIcon,
  SearchIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/cards/stat-card"
import { Badge } from "@/components/ui/badge"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { AdministrationModuleTabs } from "./administration-module-tabs"
import { CreateStaffDialog } from "./create-staff-dialog"
import { useFacilityStaff } from "../hooks/use-facility-staff"

/**
 * Staff accounts for the signed-in administrator's facility — real Medplum
 * ProjectMemberships, not the mock `STAFF` array this page used to render.
 *
 * Only accounts that genuinely exist appear here, so "who can sign in" is
 * answerable from this screen. The temporary-password column is the point: it
 * shows exactly who has been given an account but has not finished setting it
 * up, which is who to chase when someone reports they cannot get in.
 */
function StaffAccountsList() {
  const [search, setSearch] = useState("")
  const { data: user, isPending: userPending } = useCurrentUser()
  const facilityId = user?.facilityId ?? null
  const { data, isPending, error, refetch } = useFacilityStaff(facilityId)

  const staff = useMemo(() => data?.staff ?? [], [data])

  const filtered = useMemo(() => {
    if (!search) return staff
    const q = search.toLowerCase()
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q) ||
        (s.roleLabel ?? "").toLowerCase().includes(q)
    )
  }, [staff, search])

  const activeCount = staff.filter((s) => s.active).length
  const pendingSetup = staff.filter((s) => s.mustChangePassword).length

  // The platform operator has no facility of their own — accounts are managed
  // per facility from the Facilities page, so say so rather than show an empty
  // table that looks like "no staff exist".
  if (!userPending && !facilityId) {
    return (
      <div>
        <PageHeader
          title="Staff Accounts"
          description="Accounts are managed per facility"
          breadcrumbs={[{ label: "System" }, { label: "Administration" }, { label: "Users" }]}
        />
        <AdministrationModuleTabs />
        <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Your account is not bound to a facility. Open a facility from{" "}
          <span className="font-medium text-foreground">Facilities</span> to manage its staff.
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Staff Accounts"
        description={
          data ? `${staff.length} accounts at ${user?.facilityName ?? "your facility"}` : "Loading…"
        }
        breadcrumbs={[{ label: "System" }, { label: "Administration" }, { label: "Users" }]}
        actions={
          facilityId ? (
            <CreateStaffDialog
              facilityId={facilityId}
              facilityName={user?.facilityName ?? null}
              onCreated={() => refetch()}
            />
          ) : null
        }
      />

      <AdministrationModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Accounts" value={staff.length} icon={UsersIcon} />
        <StatCard label="Active" value={activeCount} icon={UserCheckIcon} tone="emerald" />
        <StatCard
          label="Awaiting password"
          value={pendingSetup}
          icon={KeyRoundIcon}
          tone="violet"
        />
      </div>

      {data?.truncated && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400"
        >
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            This list is capped and does not show every account with access to this facility.
          </span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <InputGroup className="h-9 max-w-xs">
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by name, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {(isPending || userPending) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Loading staff…
                  </td>
                </tr>
              )}

              {error && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-destructive">
                    {error instanceof Error ? error.message : "Could not load staff."}
                  </td>
                </tr>
              )}

              {!isPending && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    {staff.length === 0
                      ? "No staff accounts yet. Use “Add staff” to create the first one."
                      : "No accounts match your search."}
                  </td>
                </tr>
              )}

              {filtered.map((member) => (
                <tr key={member.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium text-foreground">{member.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {member.email ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      {member.admin && (
                        <ShieldCheckIcon className="size-3.5 text-primary" aria-hidden="true" />
                      )}
                      {member.roleLabel ?? "No role assigned"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={member.active ? "default" : "secondary"}>
                        {member.active ? "Active" : "Deactivated"}
                      </Badge>
                      {member.mustChangePassword && (
                        <Badge variant="outline" className="gap-1">
                          <KeyRoundIcon className="size-3" aria-hidden="true" />
                          Awaiting password
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export { StaffAccountsList }
