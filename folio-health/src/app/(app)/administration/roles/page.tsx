import type { Metadata } from "next"
import { RolesList } from "@/features/administration/components/roles-list"

export const metadata: Metadata = { title: "Roles" }

export default function AdministrationRolesPage() {
  return <RolesList />
}
