import type { Metadata } from "next"
import { RadiologyViewer } from "@/features/radiology/components/radiology-viewer"

export const metadata: Metadata = { title: "Imaging Study" }

export default async function RadiologyStudyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <RadiologyViewer requestId={id} />
}
