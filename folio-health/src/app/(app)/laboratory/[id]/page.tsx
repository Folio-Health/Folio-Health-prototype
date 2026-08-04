import type { Metadata } from "next"
import { LabResultDetail } from "@/features/laboratory/components/lab-result-detail"

export const metadata: Metadata = { title: "Lab Result" }

export default async function LabResultPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <LabResultDetail resultId={id} />
}
