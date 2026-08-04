import type { Metadata } from "next"
import { PermissionsMatrix } from "@/features/administration/components/permissions-matrix"

export const metadata: Metadata = { title: "Permissions" }

export default function AdministrationPermissionsPage() {
  return <PermissionsMatrix />
}
