"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  SearchIcon,
  BookOpenIcon,
  ClockIcon,
  SendIcon,
  LifeBuoyIcon,
  PlayCircleIcon,
  CheckCircle2Icon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import { unsplash, MEDICAL_IMAGES } from "@/lib/images"

const DOC_ARTICLES = [
  {
    id: "doc-1",
    title: "Getting Started with Folio Health EMR",
    category: "Basics",
    summary:
      "An overview of the platform's layout, navigation, and the modules available to your role.",
    body: "Folio Health EMR is organized into modules by department: Front Desk, Clinical, Diagnostics, Pharmacy & Finance, Facility, and Insights. Use the sidebar to move between them, and the topbar search (⌘K) to jump to any patient, page, or action instantly.",
  },
  {
    id: "doc-2",
    title: "Registering a New Patient",
    category: "Front Desk",
    summary: "Step by step guide to the patient registration wizard at Reception.",
    body: "Go to Reception → New Patient. The wizard walks through demographics, contact details, emergency contact, insurance, and an initial department assignment. Once submitted, the patient receives an MRN and appears in the Patients directory immediately.",
  },
  {
    id: "doc-3",
    title: "Booking and Managing Appointments",
    category: "Front Desk",
    summary: "How to schedule, reschedule, and check in patients for their visits.",
    body: "Appointments can be created from the Appointments module or directly from a patient's profile. Use the calendar view to see doctor availability, and the queue view to manage same day check ins and waiting room status.",
  },
  {
    id: "doc-4",
    title: "Recording Vitals and Consultations",
    category: "Clinical",
    summary: "Capturing vitals, consultation notes, and diagnoses during a visit.",
    body: "Nursing staff record vitals ahead of a consultation. Doctors then document history, examination findings, diagnosis, and next steps from the Consultation workspace, which is linked directly to the patient's chart.",
  },
  {
    id: "doc-5",
    title: "Ordering and Reviewing Lab Results",
    category: "Diagnostics",
    summary: "How lab orders move from request to collection to a reviewed result.",
    body: "Doctors place lab orders from Consultation or the Laboratory module. Lab scientists collect samples, enter results, and results are flagged automatically as Normal, Abnormal, or Critical based on reference ranges before being approved.",
  },
  {
    id: "doc-6",
    title: "Dispensing Prescriptions",
    category: "Pharmacy",
    summary: "The workflow pharmacists follow from prescription to dispensing.",
    body: "Prescriptions written during a consultation appear in the Pharmacy queue as 'To Dispense'. Pharmacists verify stock, dispense the medication, and the record updates to 'Dispensed' with the dispensing pharmacist logged.",
  },
  {
    id: "doc-7",
    title: "Understanding Invoices and Payments",
    category: "Finance",
    summary: "How billing, payments, claims, and refunds work together.",
    body: "Invoices are generated per visit or service line. Payments can be recorded against an invoice partially or in full, insurance claims can be submitted for covered patients, and refunds can be issued when needed, all tracked under Billing.",
  },
  {
    id: "doc-8",
    title: "Managing Roles and Permissions",
    category: "Administration",
    summary: "How hospital administrators control what each role can see and do.",
    body: "Administrators can define roles, assign granular permissions per module, and review activity and audit logs from the Administration area to keep the system secure and compliant.",
  },
]

const FAQS = [
  {
    q: "How do I reset my password?",
    a: "Go to the login page and select \"Forgot password?\" You'll receive a reset link by email that expires after 30 minutes for security.",
  },
  {
    q: "Why can't I see a module in the sidebar?",
    a: "Sidebar items are controlled by your assigned role and permissions. If you believe you should have access to a module, contact your hospital administrator.",
  },
  {
    q: "How long are lab results retained in the system?",
    a: "Lab results, along with the rest of a patient's medical record, are retained indefinitely in line with standard medical records retention policy.",
  },
  {
    q: "Can patients see their own records?",
    a: "Yes, patients can view their appointments, medical records, lab results, bills, and messages through the dedicated Patient Portal.",
  },
  {
    q: "How do I correct a mistake on an invoice?",
    a: "Invoices that haven't been paid can be edited from the Billing module. For paid invoices, submit a refund request instead of editing the original invoice.",
  },
  {
    q: "What happens if I don't approve a lab result?",
    a: "Results remain in \"Completed\" status and are visible to the ordering doctor, but they won't be marked \"Approved\" until a lab scientist signs off.",
  },
  {
    q: "Can I use Folio Health EMR on a tablet or mobile device?",
    a: "Yes, the interface is responsive. Some dense data tables are easiest to use on a larger screen, but core workflows work on tablets and phones.",
  },
  {
    q: "How do I request a new feature or report a bug?",
    a: "Use the Contact Support tab below to submit a ticket. Categorize it as \"Feature Request\" or \"Bug Report\" so it reaches the right team.",
  },
  {
    q: "Is my data backed up?",
    a: "Yes, hospital data is backed up automatically on a regular schedule as part of standard system operations.",
  },
]

const TUTORIALS = [
  {
    title: "Folio Health EMR in 5 Minutes",
    description: "A whirlwind tour of the sidebar, topbar, and command palette.",
    duration: "5 min",
    image: MEDICAL_IMAGES.office[0],
  },
  {
    title: "Front Desk Essentials",
    description: "Registering patients and managing the appointment queue.",
    duration: "8 min",
    image: MEDICAL_IMAGES.consultation[0],
  },
  {
    title: "Clinical Documentation Walkthrough",
    description: "Vitals, consultations, and writing prescriptions.",
    duration: "10 min",
    image: MEDICAL_IMAGES.consultation[1],
  },
  {
    title: "Working with Lab Orders",
    description: "From ordering a test to approving a result.",
    duration: "7 min",
    image: MEDICAL_IMAGES.laboratory[0],
  },
  {
    title: "Billing & Insurance Claims",
    description: "Invoices, payments, claims, and refunds explained.",
    duration: "9 min",
    image: MEDICAL_IMAGES.office[1],
  },
  {
    title: "Admin: Roles & Permissions",
    description: "Setting up roles and locking down access by module.",
    duration: "6 min",
    image: MEDICAL_IMAGES.care[0],
  },
]

const SUPPORT_CATEGORIES = ["Technical Issue", "Billing Question", "Feature Request", "Bug Report", "Account Access"] as const

const MOCK_TICKETS = [
  { id: "TCK-1042", subject: "Unable to print discharge summary", status: "Open", updated: "2 days ago" },
  { id: "TCK-1038", subject: "Request: bulk export lab results", status: "In Progress", updated: "5 days ago" },
  { id: "TCK-1021", subject: "Invoice total mismatch on INV-0231", status: "Resolved", updated: "2 weeks ago" },
]

const supportSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  category: z.enum(SUPPORT_CATEGORIES),
  message: z.string().min(1, "Please describe your issue"),
})

type SupportValues = z.infer<typeof supportSchema>

function DocumentationTab() {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return DOC_ARTICLES
    return DOC_ARTICLES.filter(
      (d) => d.title.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
    )
  }, [search])

  return (
    <div className="flex flex-col gap-4">
      <InputGroup className="max-w-sm">
        <InputGroupAddon>
          <SearchIcon className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search documentation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </InputGroup>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpenIcon} title="No articles found" description="Try a different search term." />
      ) : (
        <Accordion multiple>
          {filtered.map((doc) => (
            <AccordionItem key={doc.id} value={doc.id}>
              <AccordionTrigger>
                <div className="flex flex-col items-start gap-1 text-left">
                  <span className="flex items-center gap-2">
                    {doc.title}
                    <Badge variant="outline" className="font-normal">
                      {doc.category}
                    </Badge>
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">{doc.summary}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{doc.body}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}

function FaqsTab() {
  return (
    <Accordion multiple>
      {FAQS.map((faq) => (
        <AccordionItem key={faq.q} value={faq.q}>
          <AccordionTrigger>{faq.q}</AccordionTrigger>
          <AccordionContent>
            <p className="text-muted-foreground">{faq.a}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

function SupportTab() {
  const form = useForm<SupportValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: { subject: "", category: "Technical Issue", message: "" },
  })

  function onSubmit(values: SupportValues) {
    void values
    form.reset()
    toast.success("Support ticket submitted", {
      description: "Our team will get back to you within one business day.",
    })
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
          <CardDescription>Tell us what's going on and we'll follow up by email.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput placeholder="Briefly summarize your issue" {...field} />
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={(v) => field.onChange(v ?? SUPPORT_CATEGORIES[0])}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUPPORT_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the issue in as much detail as possible" rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit">
                  <SendIcon />
                  Submit Ticket
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Recent Tickets</CardTitle>
          <CardDescription>Status of tickets you've submitted</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {MOCK_TICKETS.map((t) => (
            <div key={t.id} className="flex flex-col gap-1 border-b border-border py-2.5 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{t.subject}</span>
                <StatusBadge status={t.status} />
              </div>
              <span className="text-xs text-muted-foreground">
                {t.id} &middot; Updated {t.updated}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

type Tutorial = (typeof TUTORIALS)[number]

function TutorialsTab() {
  const [playing, setPlaying] = useState<Tutorial | null>(null)
  const [watched, setWatched] = useState<Set<string>>(new Set())

  function markWatched(tutorial: Tutorial) {
    setWatched((prev) => new Set(prev).add(tutorial.title))
    toast.success("Marked as watched", { description: tutorial.title })
    setPlaying(null)
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {TUTORIALS.map((tutorial) => (
        <Card key={tutorial.title} className="overflow-hidden py-0">
          <div className="relative h-36 w-full">
            <Image
              src={unsplash(tutorial.image, { w: 600, q: 70 })}
              alt={tutorial.title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center bg-black/20 text-white transition-colors hover:bg-black/30"
              onClick={() => setPlaying(tutorial)}
              aria-label={`Play ${tutorial.title}`}
            >
              <PlayCircleIcon className="size-10" />
            </button>
            {watched.has(tutorial.title) && (
              <Badge className="absolute top-2 right-2 gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
                <CheckCircle2Icon className="size-3" />
                Watched
              </Badge>
            )}
          </div>
          <CardContent className="flex flex-col gap-1.5 py-4">
            <span className="text-sm font-medium text-foreground">{tutorial.title}</span>
            <span className="text-sm text-muted-foreground">{tutorial.description}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon className="size-3.5" />
              {tutorial.duration}
            </span>
          </CardContent>
        </Card>
      ))}

      <Dialog open={playing !== null} onOpenChange={(open) => !open && setPlaying(null)}>
        <DialogContent className="sm:max-w-lg">
          {playing && (
            <>
              <DialogHeader>
                <DialogTitle>{playing.title}</DialogTitle>
                <DialogDescription>{playing.description}</DialogDescription>
              </DialogHeader>
              <div className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-lg bg-black/90">
                <Image
                  src={unsplash(playing.image, { w: 800, q: 70 })}
                  alt={playing.title}
                  fill
                  className="object-cover opacity-60"
                  sizes="(min-width: 640px) 32rem, 100vw"
                />
                <PlayCircleIcon className="relative size-14 text-white" />
              </div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <ClockIcon className="size-3.5" />
                {playing.duration}
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPlaying(null)}>
                  Close
                </Button>
                <Button onClick={() => markWatched(playing)}>Mark as Watched</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function HelpCenter() {
  return (
    <div>
      <PageHeader
        title="Help Center"
        description="Documentation, answers, and support for using Folio Health EMR"
      />

      <Tabs defaultValue="documentation">
        <TabsList>
          <TabsTrigger value="documentation">
            <BookOpenIcon />
            Documentation
          </TabsTrigger>
          <TabsTrigger value="faqs">
            <LifeBuoyIcon />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="support">
            <SendIcon />
            Support
          </TabsTrigger>
          <TabsTrigger value="tutorials">
            <PlayCircleIcon />
            Tutorials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documentation" className="mt-4">
          <DocumentationTab />
        </TabsContent>
        <TabsContent value="faqs" className="mt-4">
          <FaqsTab />
        </TabsContent>
        <TabsContent value="support" className="mt-4">
          <SupportTab />
        </TabsContent>
        <TabsContent value="tutorials" className="mt-4">
          <TutorialsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { HelpCenter }
