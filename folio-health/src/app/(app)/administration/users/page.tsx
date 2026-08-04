import type { Metadata } from "next"
import { UsersList } from "@/features/administration/components/users-list"

export const metadata: Metadata = { title: "System Users" }

export default function AdministrationUsersPage() {
  return <UsersList />
}
