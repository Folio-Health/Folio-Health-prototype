import type { Metadata } from "next"
import { ConsultationWorkspace } from "@/features/consultation/components/consultation-workspace"

export const metadata: Metadata = { title: "Consultation Workspace" }

export default async function ConsultationWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ConsultationWorkspace appointmentId={id} />
}
