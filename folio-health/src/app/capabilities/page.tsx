import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import {
  ArrowRightIcon,
  BarChart3Icon,
  LockKeyholeIcon,
  SmartphoneIcon,
  MessageSquareIcon,
  TabletsIcon,
  PlugZapIcon,
  SparklesIcon,
} from "lucide-react"
import { MarketingNavbar } from "@/components/marketing/marketing-navbar"
import { MarketingFooter } from "@/components/marketing/marketing-footer"
import { FadeIn } from "@/components/marketing/fade-in"
import { FeatureShowcaseRow } from "@/components/marketing/feature-showcase-row"
import { Button } from "@/components/ui/button"
import { unsplash, MEDICAL_IMAGES } from "@/lib/images"

export const metadata: Metadata = {
  title: "Capabilities",
  description: "Everything Folio Health EMR handles beyond the ward: reporting, security, patient access, and more.",
}

const CAPABILITIES = [
  {
    title: "AI Health Assistant",
    description:
      "A built in assistant that helps staff with clinical reference questions, hospital operations, and day to day tasks, available on every page.",
    details: [
      "Quick answers on dosage, protocols, and clinical guidelines",
      "Checks bed availability and today's schedule on request",
      "Helps draft discharge summaries and clinical notes",
    ],
    image: MEDICAL_IMAGES.assistant[0],
    icon: <SparklesIcon className="size-5" />,
  },
  {
    title: "Analytics & Reporting",
    description:
      "Revenue, admissions, and department performance in live, exportable dashboards, so leadership sees problems while they're still small.",
    details: [
      "Revenue and admissions trends updated in real time",
      "Department performance compared side by side",
      "Exportable reports for board and audit meetings",
    ],
    image: MEDICAL_IMAGES.office[0],
    icon: <BarChart3Icon className="size-5" />,
  },
  {
    title: "Security & Access Control",
    description:
      "Role based permissions keep every user scoped to exactly what their job needs, with a full audit trail behind every action.",
    details: [
      "Granular, role based permissions for all 9 staff roles",
      "Every action logged in a searchable audit trail",
      "Sessions expire automatically after inactivity",
    ],
    image: MEDICAL_IMAGES.office[1],
    icon: <LockKeyholeIcon className="size-5" />,
  },
  {
    title: "Patient Portal",
    description:
      "Patients book visits, view results, and pay bills from their own dashboard, cutting down front desk calls and no shows.",
    details: [
      "Self service appointment booking and rescheduling",
      "Lab results and visit summaries, always up to date",
      "Bills and receipts patients can pay online",
    ],
    image: MEDICAL_IMAGES.care[0],
    icon: <SmartphoneIcon className="size-5" />,
  },
  {
    title: "Team Communication",
    description:
      "Internal chat, hospital wide announcements, and support tickets keep every department in sync without leaving the system.",
    details: [
      "Direct messaging between staff and departments",
      "Hospital wide announcements with read receipts",
      "Support tickets tracked from open to resolved",
    ],
    image: MEDICAL_IMAGES.consultation[1],
    icon: <MessageSquareIcon className="size-5" />,
  },
  {
    title: "Built for Ward Rounds",
    description:
      "The interface scales gracefully down to tablets, so charts, vitals, and orders are one tap away right at the bedside.",
    details: [
      "Full charting on tablet during ward rounds",
      "Vitals entry designed for quick bedside use",
      "Optimized for desktop, laptop, and tablet alike",
    ],
    image: MEDICAL_IMAGES.wards[2] ?? MEDICAL_IMAGES.wards[0],
    icon: <TabletsIcon className="size-5" />,
  },
  {
    title: "Built to Connect",
    description:
      "A modular architecture designed to connect with the lab, billing, and imaging systems your hospital already relies on.",
    details: [
      "Modular design built for future integrations",
      "Consistent data model across every department",
      "Room to grow as new departments come online",
    ],
    image: MEDICAL_IMAGES.supplies[0],
    icon: <PlugZapIcon className="size-5" />,
  },
]

export default function CapabilitiesPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <MarketingNavbar />

      <section className="relative isolate overflow-hidden">
        <Image
          src={unsplash(MEDICAL_IMAGES.office[0], { w: 1920, h: 700, q: 70 })}
          alt="Hospital administration team reviewing reports"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1224]/95 via-[#0a1224]/80 to-[#0a1224]/40" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-5 py-20 sm:px-8 sm:py-28">
          <FadeIn>
            <span className="w-fit rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
              Beyond the ward
            </span>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="max-w-2xl font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Capabilities that support the whole hospital
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="max-w-xl text-base text-white/70">
              Reporting, security, patient access, and internal communication, all built into
              the same connected system your clinical teams already use.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto flex max-w-6xl flex-col gap-20 px-5 sm:gap-28 sm:px-8">
          {CAPABILITIES.map((capability, i) => (
            <FeatureShowcaseRow key={capability.title} index={i} {...capability} />
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <FadeIn className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-5 text-center sm:px-8">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            See these capabilities in your own dashboard
          </h2>
          <Button size="lg" className="h-11 px-6" render={<Link href="/signup" />}>
            Get Started
            <ArrowRightIcon />
          </Button>
        </FadeIn>
      </section>

      <MarketingFooter />
    </div>
  )
}
