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
import { CLINICAL_ROLES } from "@/types/core"
import { useUiStore } from "@/stores/ui-store"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { signOut } from "@/lib/sign-out"

function ProfileMenu() {
  const router = useRouter()
  const activeRole = useUiStore((s) => s.activeRole)
  const setActiveRole = useUiStore((s) => s.setActiveRole)
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
        {/* "Preview as role" is a local demo switch with no bearing on what the
            server authorises. On a platform account it is doubly wrong: the
            operator plane has no clinical role to preview into, and offering
            one implies an escalation the AccessPolicy would refuse anyway. */}
        {!user?.platformOnly && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <RepeatIcon />
                Preview as role
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {CLINICAL_ROLES.map((role) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => {
                      setActiveRole(role)
                      toast.success(`Now previewing as ${role}`)
                      router.push("/dashboard")
                    }}
                  >
                    {role}
                    {role === activeRole && (
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
