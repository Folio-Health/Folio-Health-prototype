"use client"

import Link from "next/link"
import {
  Building2Icon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  HashIcon,
  UsersIcon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/cards/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState, ErrorState } from "@/components/common/empty-state"
import { ListSkeleton, StatCardGridSkeleton } from "@/components/common/loading-skeletons"
import { useFacility, useFacilityFootprint } from "../hooks/use-facilities"

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof PhoneIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm text-foreground">{value || "—"}</span>
      </div>
    </div>
  )
}

function FacilityDetail({ facilityId }: { facilityId: string }) {
  const { data: facility, isLoading, isError, error, refetch } = useFacility(facilityId)
  const footprint = useFacilityFootprint(facilityId)

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Facility" breadcrumbs={[{ label: "Facilities", href: "/facilities" }]} />
        <ListSkeleton />
      </div>
    )
  }

  if (isError) {
    const notFound = (error as { status?: number })?.status === 404
    return (
      <div>
        <PageHeader title="Facility" breadcrumbs={[{ label: "Facilities", href: "/facilities" }]} />
        {notFound ? (
          <EmptyState
            title="Facility not found"
            description="This facility record doesn't exist, or you don't have access to it."
            action={
              <Button size="sm" render={<Link href="/facilities" />}>
                Back to Facilities
              </Button>
            }
          />
        ) : (
          <ErrorState
            title="Could not load this facility"
            description={error instanceof Error ? error.message : "Could not reach Folio. Check your connection and try again."}
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            }
          />
        )}
      </div>
    )
  }

  if (!facility) return null

  return (
    <div>
      <PageHeader
        title={facility.name}
        description={facility.type}
        breadcrumbs={[
          { label: "System" },
          { label: "Facilities", href: "/facilities" },
          { label: facility.name },
        ]}
        actions={<StatusBadge status={facility.active ? "Active" : "Inactive"} />}
      />

      <div className="flex flex-col gap-6">
        {footprint.isLoading ? (
          <StatCardGridSkeleton count={1} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:max-w-md">
            <StatCard
              label="Patients"
              value={footprint.data?.patients ?? 0}
              icon={UsersIcon}
              tone="emerald"
            />
          </div>
        )}

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Facility details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <InfoRow icon={Building2Icon} label="Type" value={facility.type} />
            <InfoRow icon={HashIcon} label="Identifier" value={facility.identifier} />
            <InfoRow icon={PhoneIcon} label="Phone" value={facility.phone} />
            <InfoRow icon={MailIcon} label="Email" value={facility.email} />
            <InfoRow icon={MapPinIcon} label="Address" value={facility.address} />
            {facility.partOf && (
              <InfoRow icon={Building2Icon} label="Part of" value={facility.partOf} />
            )}
          </CardContent>
        </Card>

        <p className="max-w-2xl text-xs text-muted-foreground">
          Patient count is scoped by <code className="font-mono">managingOrganization</code>; a
          patient with no facility reference counts against none. Staff-per-facility is not shown
          because the practitioner-to-facility link runs through{" "}
          <code className="font-mono">PractitionerRole</code>, and none are recorded yet.
        </p>
      </div>
    </div>
  )
}

export { FacilityDetail }
