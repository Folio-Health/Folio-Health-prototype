import { seedFaker, id } from "./seed"
import type { AppNotification } from "@/types/core"

seedFaker(5)

const RAW: Omit<AppNotification, "id">[] = [
  {
    title: "Critical lab result",
    message: "Patient PT-1042: potassium level flagged critical. Immediate review required.",
    type: "critical",
    read: false,
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    href: "/laboratory/results",
  },
  {
    title: "ICU bed available",
    message: "Bed ICU-04 is now available following discharge.",
    type: "success",
    read: false,
    createdAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
    href: "/admissions/beds",
  },
  {
    title: "New appointment booked",
    message: "Sarah Johnson booked a follow-up with Dr. James Allen for tomorrow, 10:00 AM.",
    type: "info",
    read: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    href: "/appointments",
  },
  {
    title: "Low stock alert",
    message: "Amoxicillin 500mg is below reorder level (12 units remaining).",
    type: "warning",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    href: "/pharmacy/inventory",
  },
  {
    title: "Radiology report ready",
    message: "Chest X-ray report for John Doe (PT-1001) has been finalized.",
    type: "info",
    read: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    href: "/radiology/reports",
  },
  {
    title: "Shift handover reminder",
    message: "Evening shift handover notes are due in 30 minutes.",
    type: "warning",
    read: true,
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    href: "/nursing/shift-notes",
  },
  {
    title: "Invoice overdue",
    message: "Invoice INV-0032 for Michael Brown is 15 days overdue.",
    type: "warning",
    read: true,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    href: "/billing/outstanding",
  },
  {
    title: "New staff onboarded",
    message: "Dr. Amelia Reyes has joined the Cardiology department.",
    type: "success",
    read: true,
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    href: "/administration/users",
  },
]

export const NOTIFICATIONS: AppNotification[] = RAW.map((n, i) => ({
  ...n,
  id: id("NTF", i + 1),
}))

export function getUnreadCount(): number {
  return NOTIFICATIONS.filter((n) => !n.read).length
}
