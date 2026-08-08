import type { Metadata } from "next"
import { FacilityDetail } from "@/features/facilities/components/facility-detail"

export const metadata: Metadata = {
  title: "Facility",
}

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <FacilityDetail facilityId={id} />
}
