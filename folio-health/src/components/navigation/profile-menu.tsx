"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  LogOutIcon,
  SettingsIcon,
  UserRoundIcon,
  RepeatIcon,
  HelpCircleIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PersonAvatar } from "@/components/common/person-avatar"
import { FACILITY_ASSIGNABLE_ROLES, ROLE_LABELS, type RoleId } from "@/lib/auth/roles"
import { useUiStore } from "@/stores/ui-store"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { signOut } from "@/lib/sign-out"

/** Roles worth previewing a dashboard for. "facility-admin" is not
 * assignable via provisioning but is still a real dashboard to preview. */
const PREVIEWABLE_ROLES: Exclude<RoleId, "platform-admin">[] = [
  "facility-admin",
  ...FACILITY_ASSIGNABLE_ROLES,
]

function ProfileMenu() {
  const router = useRouter()
  const previewRole = useUiStore((s) => s.previewRole)
  const setPreviewRole = useUiStore((s) => s.setPreviewRole)
  const { data: user } = useCurrentUser()

  // Identity comes from the Medplum session, not from the locally-selected
  // role. Until it resolves, show a neutral placeholder rather than a fake
  // staff member.
  const currentUser = {
    name: user?.name ?? "Loading…",
    email: user?.email ?? user?.project ?? "",
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="Account menu"
          />
        }
      >
        <PersonAvatar name={currentUser.name} size="sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-2.5 px-1.5 py-1.5">
          <PersonAvatar name={currentUser.name} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {currentUser.name}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {currentUser.email}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/settings/profile" />}>
            <UserRoundIcon />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings" />}>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
          {/* Help Center is facility-staff guidance — not part of the
              operator plane, which cannot open the route either. */}
          {!user?.platformOnly && (
            <DropdownMenuItem render={<Link href="/help" />}>
              <HelpCircleIcon />
              Help Center
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        {/* "Preview as role" only swaps which dashboard/nav renders locally —
            it has no bearing on what the server authorises (the FHIR proxy
            still forwards every request under the signed-in user's own
            token, scoped by their real AccessPolicy). On a platform account
            it is doubly wrong: the operator plane has no clinical role to
            preview into, and offering one implies an escalation the
            AccessPolicy would refuse anyway. */}
        {!user?.platformOnly && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <RepeatIcon />
                Preview as role
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => {
                    setPreviewRole(null)
                    toast.success("Showing your own role")
                    router.push("/dashboard")
                  }}
                >
                  My role
                  {previewRole === null && (
                    <span className="ml-auto size-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {PREVIEWABLE_ROLES.map((role) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => {
                      setPreviewRole(role)
                      toast.success(`Now previewing as ${ROLE_LABELS[role]}`)
                      router.push("/dashboard")
                    }}
                  >
                    {ROLE_LABELS[role]}
                    {role === previewRole && (
                      <span className="ml-auto size-1.5 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => void signOut(router)}>
          <LogOutIcon />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ProfileMenu }
