import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { ArrowRightIcon, LifeBuoyIcon } from "lucide-react"
import { MarketingNavbar } from "@/components/marketing/marketing-navbar"
import { MarketingFooter } from "@/components/marketing/marketing-footer"
import { FadeIn } from "@/components/marketing/fade-in"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { unsplash, MEDICAL_IMAGES } from "@/lib/images"

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers to common questions about setting up and using Folio Health EMR.",
}

const FAQS = [
  {
    question: "Who is Folio Health EMR built for?",
    answer:
      "Any hospital or clinic team, from a single front desk to a full multi department facility. Every role, from reception to hospital management, gets a dashboard suited to their job.",
  },
  {
    question: "Can I try it before rolling it out to my team?",
    answer:
      "Yes. Create an account and explore the full system with realistic sample data across every module, no setup required.",
  },
  {
    question: "Does Folio Health EMR work on tablets during ward rounds?",
    answer:
      "The interface adapts down to tablet size, so doctors and nurses can pull up charts and record vitals during rounds, not just at a desk.",
  },
  {
    question: "How is patient data kept secure?",
    answer:
      "Access is scoped by role, every action is logged in the audit trail, and sessions expire automatically after inactivity.",
  },
  {
    question: "Can departments that already use other software connect to Folio Health EMR?",
    answer:
      "The system is built on a modular architecture designed to connect to lab, billing, and imaging systems your hospital already relies on.",
  },
  {
    question: "What if my team needs help getting started?",
    answer:
      "Our support team and the in app Help Center walk new staff through registration, scheduling, and daily workflows.",
  },
  {
    question: "Does every staff member see the same dashboard?",
    answer:
      "No. Receptionists, doctors, nurses, lab scientists, pharmacists, and administrators each get a dashboard built around their own daily tasks.",
  },
  {
    question: "Can patients access their own records?",
    answer:
      "Yes, through a separate Patient Portal where they can view appointments, lab results, bills, and message the hospital directly.",
  },
]

export default function FaqsPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <MarketingNavbar />

      <section className="relative isolate overflow-hidden">
        <Image
          src={unsplash(MEDICAL_IMAGES.consultation[0], { w: 1920, h: 600, q: 70 })}
          alt="Clinician reviewing a question with a colleague"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0E443B]/95 via-[#0E443B]/80 to-[#0E443B]/40" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-5 py-16 sm:px-8 sm:py-24">
          <FadeIn>
            <span className="w-fit rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
              Questions
            </span>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="max-w-2xl font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Frequently asked questions
            </h1>
          </FadeIn>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <FadeIn>
            <Accordion className="flex flex-col gap-2">
              {FAQS.map((faq) => (
                <AccordionItem
                  key={faq.question}
                  value={faq.question}
                  className="rounded-xl border border-border px-4"
                >
                  <AccordionTrigger className="text-left text-sm font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <FadeIn className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-5 text-center sm:px-8">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Still have a question?
          </h2>
          <p className="text-sm text-muted-foreground">
            Our support team is ready to help you get set up.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" className="h-11 px-6" render={<Link href="/support" />}>
              <LifeBuoyIcon />
              Visit Support
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-6" render={<Link href="/signup" />}>
              Get Started
              <ArrowRightIcon />
            </Button>
          </div>
        </FadeIn>
      </section>

      <MarketingFooter />
    </div>
  )
}
