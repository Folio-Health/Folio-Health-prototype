import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  UsersRoundIcon,
  ActivityIcon,
  ClockIcon,
  UserPlusIcon,
  CalendarDaysIcon,
  StethoscopeIcon,
  FlaskConicalIcon,
  PillIcon,
  ReceiptIcon,
  BedDoubleIcon,
  BarChart3Icon,
  ClipboardListIcon,
  FileTextIcon,
  ZapIcon,
  HeartHandshakeIcon,
  LineChartIcon,
  ChevronDownIcon,
} from "lucide-react"
import { MarketingNavbar } from "@/components/marketing/marketing-navbar"
import { MarketingFooter } from "@/components/marketing/marketing-footer"
import { WaveDivider } from "@/components/marketing/wave-divider"
import { SlashDivider } from "@/components/marketing/slash-divider"
import { DashboardPreview } from "@/components/marketing/dashboard-preview"
import { LaptopFrame } from "@/components/marketing/laptop-frame"
import { PhoneFrame } from "@/components/marketing/phone-frame"
import { MobileDashboardPreview } from "@/components/marketing/mobile-dashboard-preview"
import { FadeIn } from "@/components/marketing/fade-in"
import { BgFadeIn } from "@/components/marketing/bg-fade-in"
import { WordmarkReveal } from "@/components/marketing/wordmark-reveal"
import { CookieConsent } from "@/components/marketing/cookie-consent"
import { WelcomeModal } from "@/components/marketing/welcome-modal"
import { FeaturePanel } from "@/components/marketing/feature-panel"
import { BenefitCard } from "@/components/marketing/benefit-card"
import { Button } from "@/components/ui/button"
import { unsplash, MEDICAL_IMAGES } from "@/lib/images"

export const metadata: Metadata = {
  title: "Folio Health EMR: Hospital Information System",
  description:
    "One connected system for reception, doctors, nurses, labs, pharmacy, and billing.",
}

const STATS_BG = "#0d1a33"
const MUTED_BG = "oklch(0.968 0.007 247.896)"

const PANELS = [
  {
    title: "Compassionate Consultations",
    description: "A complete patient picture in one workspace: vitals, history, and notes together.",
    image: MEDICAL_IMAGES.consultation[0],
    details: ["Live vitals and history side by side", "SOAP notes with orders in one workspace", "Next visit scheduled before you leave"],
  },
  {
    title: "Trusted Diagnostics",
    description: "Lab and radiology results flow straight into the chart the moment they're ready.",
    image: MEDICAL_IMAGES.laboratory[0],
    details: ["Lab orders tracked from sample to result", "Radiology reports with an image viewer", "Critical results flagged automatically"],
  },
  {
    title: "Pharmacy, Simplified",
    description: "Prescriptions, inventory, and dispensing stay in sync across every outlet.",
    image: MEDICAL_IMAGES.pharmacy[0],
    details: ["Prescriptions route straight to dispensing", "Live stock levels and expiry tracking", "Low stock alerts before you run out"],
  },
  {
    title: "Modern Inpatient Care",
    description: "Bed allocation, nursing tasks, and admissions coordinated in real time.",
    image: MEDICAL_IMAGES.wards[0],
    details: ["Live bed and ward occupancy", "Nursing tasks and MAR in one view", "Smooth transfers and discharge planning"],
  },
]

const MODULES = [
  { label: "Reception", icon: UserPlusIcon },
  { label: "Appointments", icon: CalendarDaysIcon },
  { label: "Consultation", icon: StethoscopeIcon },
  { label: "Laboratory", icon: FlaskConicalIcon },
  { label: "Pharmacy", icon: PillIcon },
  { label: "Billing", icon: ReceiptIcon },
  { label: "Admissions", icon: BedDoubleIcon },
  { label: "Analytics", icon: BarChart3Icon },
]

const STATS = [
  { label: "Modules covered", value: "35+" },
  { label: "Hospital departments", value: "20" },
  { label: "Staff roles supported", value: "9" },
  { label: "Uptime target", value: "99.9%" },
]

const TRUST_ROW = [
  { label: "Access for every role", icon: UsersRoundIcon },
  { label: "Live records", icon: ActivityIcon },
  { label: "Secure by design", icon: ShieldCheckIcon },
  { label: "Built for uptime", icon: ClockIcon },
]

const STEPS = [
  {
    title: "Register & Check In",
    description: "Front desk captures patient details once, in seconds, then it's reused everywhere downstream.",
    icon: UserPlusIcon,
  },
  {
    title: "Consult & Diagnose",
    description: "Doctors review history, record vitals, and write SOAP notes in a single workspace.",
    icon: StethoscopeIcon,
  },
  {
    title: "Test, Treat & Dispense",
    description: "Lab, radiology, and pharmacy orders route automatically and results land back on the chart.",
    icon: ClipboardListIcon,
  },
  {
    title: "Bill & Follow Up",
    description: "Invoices, insurance claims, and the next appointment are handled before the patient leaves.",
    icon: FileTextIcon,
  },
]

const BENEFITS = [
  {
    title: "Faster charting",
    description:
      "SOAP notes, orders, and prescriptions live in one workspace, so doctors spend minutes on documentation, not hours.",
    detail: "One workspace replaces switching between paper charts, order pads, and separate prescription pads.",
    icon: ZapIcon,
  },
  {
    title: "Fewer handoff errors",
    description:
      "Every department reads from the same chart, so nothing gets retyped, mistranslated, or lost between shifts.",
    detail: "Nursing notes, lab results, and consult summaries are all visible the instant they're saved.",
    icon: HeartHandshakeIcon,
  },
  {
    title: "Clearer decisions",
    description:
      "Administrators see occupancy, revenue, and patient load the moment they log in, not at the end of the month.",
    detail: "Live dashboards replace monthly spreadsheets, so problems surface while they're still small.",
    icon: LineChartIcon,
  },
]

/** Solid outline button meant to sit on a dark photo — the default `outline`
 * variant's `bg-background` would otherwise render white text on a white
 * button once its border/text colors are overridden for a dark backdrop. */
const OUTLINE_ON_DARK =
  "border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-background">
      <MarketingNavbar />

      {/* Hero — full-bleed photo background */}
      <section className="relative isolate flex min-h-[94vh] items-center overflow-hidden">
        <Image
          src={unsplash(MEDICAL_IMAGES.consultation[3], { w: 1920, h: 1200, q: 75 })}
          alt="Doctor consulting with a patient at Folio Health EMR"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060a14]/95 via-[#060a14]/80 to-[#060a14]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060a14]/70 via-transparent to-[#060a14]/20" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-5 py-24 sm:px-8 lg:max-w-3xl lg:py-32">
          <FadeIn>
            <span className="w-fit rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
              Next-gen Hospital Management
            </span>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Healthcare technology that puts <span className="text-blue-400">people first</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="max-w-lg text-base text-white/70">
              Folio Health EMR brings every department, from reception and doctors to nurses, labs,
              pharmacy, and billing, onto one connected system, so your team can spend less time
              on paperwork and more time on patients.
            </p>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className="h-11 px-6" render={<Link href="/signup" />}>
                Get Started
                <ArrowRightIcon />
              </Button>
              <Button size="lg" variant="outline" className={`h-11 px-6 ${OUTLINE_ON_DARK}`} render={<Link href="/login" />}>
                Sign In
              </Button>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              {TRUST_ROW.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-white/60">
                  <item.icon className="size-4 text-blue-400" />
                  {item.label}
                </div>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={0.25}>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-6">
              {STATS.slice(0, 3).map((stat) => (
                <div key={stat.label} className="flex flex-col gap-0.5">
                  <p className="font-heading text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="text-xs text-white/50">{stat.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>

        <div className="absolute inset-x-0 bottom-8 flex justify-center">
          <ChevronDownIcon className="size-6 animate-bounce text-white/50" />
        </div>
      </section>

      {/* Live dashboard preview */}
      <section className="relative isolate overflow-hidden bg-background py-20">
        <BgFadeIn className="absolute inset-0">
          <Image
            src={unsplash(MEDICAL_IMAGES.consultation[2], { w: 1400, h: 1400, q: 60 })}
            alt=""
            fill
            aria-hidden="true"
            className="object-cover opacity-20"
            style={{ objectPosition: "20% 30%" }}
          />
        </BgFadeIn>
        <div className="absolute inset-0 bg-gradient-to-r from-background/10 via-background/60 to-background" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="flex flex-col gap-8">
              <WordmarkReveal />
              <FadeIn className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-primary">See it in action</p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
                A command center for your whole hospital
              </h2>
              <p className="text-base text-muted-foreground">
                Administrators get a live read on patients, appointments, admissions, and
                revenue the moment they sign in, the exact same dashboard every role in this
                system uses, tailored to what they need to see.
              </p>
              <ul className="mt-2 flex flex-col gap-3 text-sm text-foreground">
                <li className="flex items-center gap-2.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ActivityIcon className="size-3" />
                  </span>
                  Live patient visit and admissions trends
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BarChart3Icon className="size-3" />
                  </span>
                  Department load and revenue at a glance
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UsersRoundIcon className="size-3" />
                  </span>
                  A dedicated view for every one of 9 hospital roles
                </li>
              </ul>
            </FadeIn>
            </div>
            <FadeIn delay={0.1}>
              <div className="relative pr-6 pb-10 sm:pr-10 sm:pb-14">
                <LaptopFrame>
                  <DashboardPreview />
                </LaptopFrame>
                <div className="absolute -right-2 -bottom-4 origin-bottom-right scale-[0.65] rotate-[6deg] drop-shadow-2xl sm:-right-4 sm:-bottom-6 sm:scale-75">
                  <PhoneFrame>
                    <MobileDashboardPreview />
                  </PhoneFrame>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <WaveDivider prevBg="var(--background)" nextBg={MUTED_BG} />

      {/* How it works */}
      <section className="relative overflow-hidden py-20" style={{ backgroundColor: MUTED_BG }}>
        <BgFadeIn className="absolute inset-0">
          <Image
            src={unsplash(MEDICAL_IMAGES.wards[1] ?? MEDICAL_IMAGES.wards[0], { w: 1920, h: 1080, q: 60 })}
            alt=""
            fill
            aria-hidden="true"
            className="object-cover opacity-15 grayscale"
          />
        </BgFadeIn>
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">How it works</p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">
              From checking in to following up, one connected record
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Every department works off the same patient chart, so nothing gets retyped,
              explained twice, or lost between handoffs.
            </p>
          </FadeIn>

          <div className="relative mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="absolute top-6 right-0 left-0 hidden h-px bg-border lg:block" aria-hidden="true" />
            {STEPS.map((step, i) => (
              <FadeIn key={step.title} delay={i * 0.08} className="relative flex flex-col items-center gap-3 text-center">
                <span className="relative z-10 flex size-12 items-center justify-center rounded-full border border-border bg-background text-primary shadow-sm">
                  <step.icon className="size-5" />
                </span>
                <p className="text-xs font-semibold text-muted-foreground">Step {i + 1}</p>
                <p className="font-heading text-base font-semibold text-foreground">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Why teams choose Folio Health EMR */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">Why Folio Health EMR</p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">
              Built to reduce the busywork, not add to it
            </h2>
          </FadeIn>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {BENEFITS.map((benefit, i) => (
              <FadeIn key={benefit.title} delay={i * 0.08}>
                <BenefitCard
                  title={benefit.title}
                  description={benefit.description}
                  detail={benefit.detail}
                  icon={<benefit.icon className="size-5" />}
                />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Features — full-bleed panel mosaic, no cards, no gaps between quadrants */}
      <section id="features" className="bg-background pb-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <FadeIn className="mx-auto max-w-2xl pb-12 text-center">
            <p className="text-sm font-semibold text-primary">Everything in one place</p>
            <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">
              Built for every corner of your hospital
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              From the front desk to the pharmacy counter, each team works from the same
              current patient record.
            </p>
          </FadeIn>
        </div>

        <FadeIn>
          <div className="grid grid-cols-1 gap-0.5 bg-border sm:grid-cols-2">
            {PANELS.map((panel) => (
              <FeaturePanel key={panel.title} {...panel} />
            ))}
          </div>
        </FadeIn>

        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {/* Module strip */}
          <div id="modules" className="mt-16 flex flex-col items-center gap-6">
            <p className="text-sm font-medium text-muted-foreground">
              One system, every department
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {MODULES.map((mod) => (
                <div
                  key={mod.label}
                  className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-foreground"
                >
                  <mod.icon className="size-4 text-primary" />
                  {mod.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SlashDivider prevBg="var(--background)" nextBg={STATS_BG} flip />

      {/* Stats */}
      <section id="about" className="py-16" style={{ backgroundColor: STATS_BG }}>
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 sm:px-8 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.06} className="flex flex-col items-center gap-1 text-center">
              <p className="font-heading text-3xl font-semibold text-white sm:text-4xl">
                {stat.value}
              </p>
              <p className="text-sm text-white/50">{stat.label}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA — full-bleed photo background across the entire section */}
      <section className="relative isolate overflow-hidden">
        <Image
          src={unsplash(MEDICAL_IMAGES.buildings[0], { w: 1920, h: 900, q: 75 })}
          alt="Folio Health EMR hospital campus"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1224]/95 via-[#0a1224]/85 to-[#0a1224]/55" />

        <FadeIn>
          <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-5 px-5 py-20 sm:px-8 sm:py-28">
            <h2 className="max-w-lg font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to see Folio Health EMR in action?
            </h2>
            <p className="max-w-md text-white/70">
              Create an account to explore the full system: every role, every department, one
              connected record.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="h-11 px-6" render={<Link href="/signup" />}>
                Get Started
                <ArrowRightIcon />
              </Button>
              <Button size="lg" variant="outline" className={`h-11 px-6 ${OUTLINE_ON_DARK}`} render={<Link href="/login" />}>
                Sign In
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>

      <MarketingFooter />
      <WelcomeModal />
      <CookieConsent />
    </div>
  )
}
