"use client"

import Link from "next/link"
import type { Route } from "next"
import {
  ArrowRightIcon,
  ClipboardPlusIcon,
  FlaskConicalIcon,
  PillIcon,
  ScanIcon,
  StethoscopeIcon,
  UserPlusIcon,
  UsersIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { RoleId } from "@/lib/auth/roles"

/**
 * The one thing this role came here to do (Implementation Manuscript §6).
 *
 * §6 is a standing product design goal: a first-time user's starting point
 * should be completely unambiguous — no guessing what to click first — so
 * staff get comfortable within minutes rather than hours.
 *
 * Four of the role dashboards opened straight onto a row of stat cards, which
 * tells a new user how busy the department is but not what they are supposed
 * to do. This puts the primary action first, before the numbers, for every
 * role including the ones that already had one.
 *
 * It is deliberately not dismissible: the primary action of a shift does not
 * stop being the primary action once you have seen it, and dismissal state is
 * one more thing to get wrong.
 */
interface PrimaryAction {
  headline: string
  description: string
  label: string
  href: Route
  icon: LucideIcon
}

const ROLE_PRIMARY_ACTION: Record<Exclude<RoleId, "platform-admin">, PrimaryAction> = {
  doctor: {
    headline: "Start a consultation",
    description: "Your next patient is waiting in the consultation queue.",
    label: "Open consultations",
    href: "/consultation" as Route,
    icon: StethoscopeIcon,
  },
  nurse: {
    headline: "Record vitals",
    description: "Temperature, pulse, respiration, blood pressure and SpO2 for the patients in front of you.",
    label: "Go to vitals",
    href: "/vitals" as Route,
    icon: ClipboardPlusIcon,
  },
  "front-desk": {
    headline: "Register a patient",
    description: "New arrival? Start here. Everything you capture flows to every professional after you.",
    label: "Register patient",
    href: "/reception/register" as Route,
    icon: UserPlusIcon,
  },
  "lab-scientist": {
    headline: "Work the order queue",
    description: "Accept specimens, enter results and release them back to the ordering physician.",
    label: "Open laboratory",
    href: "/laboratory" as Route,
    icon: FlaskConicalIcon,
  },
  radiographer: {
    headline: "Work the imaging queue",
    description: "Capture studies and upload findings for the requesting physician to view.",
    label: "Open radiology",
    href: "/radiology" as Route,
    icon: ScanIcon,
  },
  pharmacist: {
    headline: "Dispense prescriptions",
    description: "Allergies and the reason for each prescription show before you dispense.",
    label: "Open pharmacy",
    href: "/pharmacy" as Route,
    icon: PillIcon,
  },
  "him-officer": {
    headline: "Manage patient records",
    description: "Correct demographics, handle disclosure requests and export records.",
    label: "Open patients",
    href: "/patients" as Route,
    icon: UsersIcon,
  },
  "billing-cashier": {
    headline: "Post charges and take payment",
    description: "Outstanding invoices, payments and claims for this facility.",
    label: "Open billing",
    href: "/billing" as Route,
    icon: ReceiptIcon,
  },
  "facility-admin": {
    headline: "Manage staff and access",
    description: "Create accounts, assign roles and review who has seen what.",
    label: "Open administration",
    href: "/administration" as Route,
    icon: ShieldCheckIcon,
  },
}

function StartHereCard({ role }: { role: Exclude<RoleId, "platform-admin"> | undefined }) {
  const action = role ? ROLE_PRIMARY_ACTION[role] : undefined
  if (!action) return null

  const Icon = action.icon

  return (
    <Card className="border-primary/20 bg-primary/4">
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Icon className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="font-heading text-base font-semibold text-foreground">{action.headline}</p>
            <p className="text-sm text-balance text-muted-foreground">{action.description}</p>
          </div>
        </div>
        <Button render={<Link href={action.href} />}>
          {action.label}
          <ArrowRightIcon />
        </Button>
      </CardContent>
    </Card>
  )
}

export { StartHereCard }
