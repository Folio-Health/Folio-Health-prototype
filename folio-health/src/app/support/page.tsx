import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import {
  ArrowRightIcon,
  LifeBuoyIcon,
  BookOpenIcon,
  MailIcon,
  MessageCircleQuestionIcon,
} from "lucide-react"
import { MarketingNavbar } from "@/components/marketing/marketing-navbar"
import { MarketingFooter } from "@/components/marketing/marketing-footer"
import { FadeIn } from "@/components/marketing/fade-in"
import { FeatureShowcaseRow } from "@/components/marketing/feature-showcase-row"
import { Button } from "@/components/ui/button"
import { unsplash, MEDICAL_IMAGES } from "@/lib/images"

export const metadata: Metadata = {
  title: "Support",
  description: "Get help setting up and running Folio Health EMR across your hospital.",
}

const CHANNELS = [
  {
    title: "Help Center",
    description:
      "Search articles covering registration, scheduling, billing, and every clinical module, written for the staff who use them day to day.",
    details: [
      "Searchable articles for every module",
      "Written for front line staff, not developers",
      "Updated as new features ship",
    ],
    image: MEDICAL_IMAGES.office[0],
    icon: <LifeBuoyIcon className="size-5" />,
  },
  {
    title: "Documentation",
    description:
      "Step by step guides for administrators setting up departments, roles, and permissions across the hospital.",
    details: [
      "Setup guides for administrators",
      "Role and permission walkthroughs",
      "Department and workflow configuration",
    ],
    image: MEDICAL_IMAGES.office[1],
    icon: <BookOpenIcon className="size-5" />,
  },
  {
    title: "FAQs",
    description:
      "Quick answers to the questions hospital teams ask most often before and after rolling the system out.",
    details: [
      "Common rollout and onboarding questions",
      "Security and access answers",
      "A shortcut before contacting support directly",
    ],
    image: MEDICAL_IMAGES.consultation[0],
    icon: <MessageCircleQuestionIcon className="size-5" />,
  },
]

export default function SupportPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <MarketingNavbar />

      <section className="relative isolate overflow-hidden">
        <Image
          src={unsplash(MEDICAL_IMAGES.staffPortraits[0], { w: 1920, h: 700, q: 70 })}
          alt="Folio Health support specialist"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          style={{ objectPosition: "50% 20%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0E443B]/95 via-[#0E443B]/80 to-[#0E443B]/40" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-5 py-20 sm:px-8 sm:py-28">
          <FadeIn>
            <span className="w-fit rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
              We&apos;re here to help
            </span>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="max-w-2xl font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Support for your whole team
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="max-w-xl text-base text-white/70">
              Whether your staff need a hand getting set up or troubleshooting a workflow,
              our support team and Help Center are ready.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto flex max-w-6xl flex-col gap-20 px-5 sm:gap-28 sm:px-8">
          {CHANNELS.map((channel, i) => (
            <FeatureShowcaseRow key={channel.title} index={i} {...channel} />
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <FadeIn className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-5 text-center sm:px-8">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Reach us directly
          </h2>
          <p className="text-sm text-muted-foreground">
            We typically respond within one business day.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" className="h-11 px-6" render={<Link href="/help" />}>
              <LifeBuoyIcon />
              Go to Help Center
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-6" render={<Link href="/faqs" />}>
              Browse FAQs
              <ArrowRightIcon />
            </Button>
          </div>
          <a
            href="mailto:hello@foliohealth.example"
            className="mt-1 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <MailIcon className="size-4" />
            hello@foliohealth.example
          </a>
        </FadeIn>
      </section>

      <MarketingFooter />
    </div>
  )
}
