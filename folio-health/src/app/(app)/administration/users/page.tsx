import type { Metadata } from "next"
import { StaffAccountsList } from "@/features/administration/components/staff-accounts-list"

export const metadata: Metadata = { title: "Staff Accounts" }

/**
 * Real staff accounts from Medplum.
 *
 * Replaces the mock `UsersList`, which rendered the invented `STAFF` array and
 * "created" users into local state — so an administrator could add someone, see
 * them in the table, and have no account exist.
 */
export default function AdministrationUsersPage() {
  return <StaffAccountsList />
}
