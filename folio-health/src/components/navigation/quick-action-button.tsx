"use client"

import Link from "next/link"
import type { Route } from "next"
import {
  PlusIcon,
  UserPlusIcon,
  CalendarPlusIcon,
  PillIcon,
  FlaskConicalIcon,
  ReceiptIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCurrentUser } from "@/lib/fhir/use-current-user"

const ACTIONS = [
  { label: "New Patient", href: "/reception/register", icon: UserPlusIcon },
  { label: "New Appointment", href: "/appointments/new", icon: CalendarPlusIcon },
  { label: "New Prescription", href: "/pharmacy", icon: PillIcon },
  { label: "New Lab Order", href: "/laboratory", icon: FlaskConicalIcon },
  { label: "New Invoice", href: "/billing", icon: ReceiptIcon },
]

function QuickActionButton() {
  const { data: user } = useCurrentUser()

  // Every quick action is clinical, and the operator plane can open none of
  // them. An always-disabled control is worse than no control.
  if (user?.platformOnly) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="icon" aria-label="Quick create" />}>
        <PlusIcon className="size-4.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {/* DropdownMenuLabel is base-ui's Menu.GroupLabel and THROWS if it has
            no Menu.Group ancestor ("MenuGroupContext is missing"), which took
            down the whole page the moment this menu opened. Keep the label and
            its items inside the group. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Quick create</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ACTIONS.map((action) => (
            <DropdownMenuItem key={action.label} render={<Link href={action.href as Route} />}>
              <action.icon />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { QuickActionButton }
