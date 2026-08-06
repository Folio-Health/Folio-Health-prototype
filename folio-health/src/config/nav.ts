import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboardIcon,
  UserPlusIcon,
  UsersIcon,
  CalendarDaysIcon,
  StethoscopeIcon,
  ActivityIcon,
  FlaskConicalIcon,
  ScanIcon,
  PillIcon,
  ReceiptIcon,
  BedDoubleIcon,
  SirenIcon,
  ClipboardPlusIcon,
  ScissorsIcon,
  BabyIcon,
  HeartPulseIcon,
  DropletIcon,
  PackageIcon,
  ContactIcon,
  ShieldCheckIcon,
  BarChart3Icon,
  MessageSquareIcon,
  SettingsIcon,
  CircleHelpIcon,
  SmartphoneIcon,
  SparklesIcon,
  Building2Icon,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
      { title: "AI Assistant", href: "/assistant", icon: SparklesIcon },
    ],
  },
  {
    label: "Front Desk",
    items: [
      { title: "Reception", href: "/reception", icon: UserPlusIcon },
      { title: "Patients", href: "/patients", icon: UsersIcon },
      { title: "Appointments", href: "/appointments", icon: CalendarDaysIcon },
    ],
  },
  {
    label: "Clinical",
    items: [
      { title: "Consultation", href: "/consultation", icon: StethoscopeIcon },
      { title: "Vitals", href: "/vitals", icon: ActivityIcon },
      { title: "Nursing", href: "/nursing", icon: ClipboardPlusIcon },
      { title: "Emergency", href: "/emergency", icon: SirenIcon },
      { title: "Surgery", href: "/surgery", icon: ScissorsIcon },
      { title: "Pediatrics", href: "/pediatrics", icon: BabyIcon },
      { title: "Obstetrics", href: "/obstetrics", icon: HeartPulseIcon },
    ],
  },
  {
    label: "Diagnostics",
    items: [
      { title: "Laboratory", href: "/laboratory", icon: FlaskConicalIcon },
      { title: "Radiology", href: "/radiology", icon: ScanIcon },
      { title: "Blood Bank", href: "/blood-bank", icon: DropletIcon },
    ],
  },
  {
    label: "Pharmacy & Finance",
    items: [
      { title: "Pharmacy", href: "/pharmacy", icon: PillIcon },
      { title: "Billing", href: "/billing", icon: ReceiptIcon },
    ],
  },
  {
    label: "Facility",
    items: [
      { title: "Admissions", href: "/admissions", icon: BedDoubleIcon },
      { title: "Inventory", href: "/inventory", icon: PackageIcon },
      { title: "HR", href: "/hr", icon: ContactIcon },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Analytics", href: "/analytics", icon: BarChart3Icon },
      { title: "Communication", href: "/communication", icon: MessageSquareIcon },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Facilities", href: "/facilities", icon: Building2Icon },
      { title: "Administration", href: "/administration", icon: ShieldCheckIcon },
      { title: "Settings", href: "/settings", icon: SettingsIcon },
      { title: "Help Center", href: "/help", icon: CircleHelpIcon },
    ],
  },
]

export const PATIENT_PORTAL_NAV: NavItem[] = [
  { title: "Dashboard", href: "/portal", icon: LayoutDashboardIcon },
  { title: "Appointments", href: "/portal/appointments", icon: CalendarDaysIcon },
  { title: "Medical Records", href: "/portal/records", icon: ClipboardPlusIcon },
  { title: "Lab Results", href: "/portal/lab-results", icon: FlaskConicalIcon },
  { title: "Bills", href: "/portal/bills", icon: ReceiptIcon },
  { title: "Messages", href: "/portal/messages", icon: MessageSquareIcon },
  { title: "Downloads", href: "/portal/downloads", icon: SmartphoneIcon },
]

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items)
