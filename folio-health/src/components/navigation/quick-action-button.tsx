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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ACTIONS = [
  { label: "New Patient", href: "/reception/register", icon: UserPlusIcon },
  { label: "New Appointment", href: "/appointments/new", icon: CalendarPlusIcon },
  { label: "New Prescription", href: "/pharmacy", icon: PillIcon },
  { label: "New Lab Order", href: "/laboratory", icon: FlaskConicalIcon },
  { label: "New Invoice", href: "/billing", icon: ReceiptIcon },
]

function QuickActionButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="icon" aria-label="Quick create" />}>
        <PlusIcon className="size-4.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Quick create</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ACTIONS.map((action) => (
          <DropdownMenuItem key={action.label} render={<Link href={action.href as Route} />}>
            <action.icon />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { QuickActionButton }
