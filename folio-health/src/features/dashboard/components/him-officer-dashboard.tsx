import Link from "next/link"
import { FileTextIcon, CopyIcon, ShieldCheckIcon, ClipboardListIcon, SearchIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/cards/stat-card"
import { EmptyState } from "@/components/common/empty-state"

/**
 * Medical Records Officer dashboard (EMR V1 RBAC spec §7.6, §16).
 *
 * Duplicate-management and record-release queues don't have a dedicated
 * data model yet (no Task/duplicate-flag FHIR resources wired up), so this
 * intentionally shows structure and real navigation (Patients) without
 * fabricating queue numbers for workflows that don't exist server-side yet.
 */
function HimOfficerDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Records Managed" value="—" icon={FileTextIcon} />
        <StatCard label="Duplicate Flags" value="—" icon={CopyIcon} tone="amber" />
        <StatCard label="Release Requests" value="—" icon={ShieldCheckIcon} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Duplicate & Release Queue</CardTitle>
            <CardDescription>
              Pending demographic corrections, duplicate merges, and approved record releases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={ClipboardListIcon}
              title="No queue wired up yet"
              description="Duplicate-flagging and record-release requests aren't backed by a real workflow yet — this is where they'll appear once that's built."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button render={<Link href="/patients" />}>
              <SearchIcon />
              Search Patient Records
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export { HimOfficerDashboard }
