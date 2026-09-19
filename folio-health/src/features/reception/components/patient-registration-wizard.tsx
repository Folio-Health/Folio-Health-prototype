"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  UserRoundIcon,
  PhoneIcon,
  ShieldCheckIcon,
  ContactRoundIcon,
  ClipboardCheckIcon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RegistrationStepper } from "./registration-stepper"
import { RoleGate } from "@/components/common/role-gate"
import { unsplash, MEDICAL_IMAGES } from "@/lib/images"
import type { BloodGroup } from "@/types/core"

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

/**
 * Registration captures the biodata set in Implementation Manuscript §4.1.
 *
 * Three of these fields are there for clinical reasons the manuscript spells
 * out, not for demographics reporting:
 *   - ethnicity/tribe, because some conditions are ethnicity-linked;
 *   - religion, because e.g. blood-transfusion refusal in some faiths is
 *     something the physician needs to know going in, not discover mid-crisis;
 *   - source of referral, because a patient sent from a PHC has already been
 *     worked up somewhere and should not be re-clerked from zero (§1).
 *
 * "Next of Kin" rather than "Emergency Contact" is the manuscript's own term
 * and the one used in Nigerian clinical practice.
 */
const STEPS = [
  "Personal Info",
  "Contact & Address",
  "Next of Kin",
  "Visit Details",
  "Insurance",
  "Review",
]

/** Major ethnic groups, with a free-text escape — the list is never complete. */
const ETHNIC_GROUPS = [
  "Hausa",
  "Yoruba",
  "Igbo",
  "Fulani",
  "Ijaw",
  "Kanuri",
  "Ibibio",
  "Tiv",
  "Efik",
  "Edo",
  "Urhobo",
  "Nupe",
  "Idoma",
  "Prefer not to say",
  "Other",
]

const RELIGIONS = ["Christianity", "Islam", "Traditional", "Other", "Prefer not to say"]

/** §4.1: self-referral vs. referred, and from where. */
const REFERRAL_SOURCES = [
  "Self-referral",
  "Primary health centre (PHC)",
  "Secondary facility",
  "Private hospital",
  "Teaching / tertiary hospital",
  "Traditional or alternative practitioner",
  "Employer or occupational health",
  "Other",
]

const SELF_REFERRAL = "Self-referral"

const registrationSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    gender: z.enum(["Male", "Female", "Other"]),
    dob: z.string().min(1, "Date of birth is required"),
    bloodGroup: z.string().min(1, "Blood group is required"),
    maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]),
    occupation: z.string().min(1, "Occupation is required"),

    // §2: the patient ID strategy is moving off the raw NIN, now treated as
    // too sensitive to use directly, onto the 16-digit VNIN as the primary
    // linkable identifier. Not every patient presents with one, so the
    // checkbox below is an explicit, recorded exception rather than a blank
    // field nobody notices.
    vnin: z.string().optional(),
    noVnin: z.boolean(),

    ethnicity: z.string().min(1, "Ethnicity is required"),
    religion: z.string().min(1, "Religion is required"),

    phone: z.string().min(7, "Enter a valid phone number"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    addressLine1: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),

    emergencyName: z.string().min(1, "Next of kin name is required"),
    emergencyRelationship: z.string().min(1, "Relationship is required"),
    emergencyPhone: z.string().min(7, "Enter a valid phone number"),

    // §4.1: date and time of presentation, and how the patient got here.
    presentedOnDate: z.string().min(1, "Date of presentation is required"),
    presentedAtTime: z.string().min(1, "Time of presentation is required"),
    referralSource: z.string().min(1, "Source of referral is required"),
    referringFacility: z.string().optional(),

    selfPay: z.boolean(),
    insuranceProvider: z.string().optional(),
    policyNumber: z.string().optional(),
    plan: z.string().optional(),
    validTill: z.string().optional(),
  })
  .refine((data) => data.selfPay || !!data.insuranceProvider?.trim(), {
    message: "Insurance provider is required unless self pay",
    path: ["insuranceProvider"],
  })
  .refine((data) => data.selfPay || !!data.policyNumber?.trim(), {
    message: "Policy number is required unless self pay",
    path: ["policyNumber"],
  })
  .refine((data) => data.noVnin || /^\d{16}$/.test((data.vnin ?? "").replace(/\s/g, "")), {
    message: "A VNIN is exactly 16 digits",
    path: ["vnin"],
  })
  .refine(
    (data) => data.referralSource === SELF_REFERRAL || !!data.referringFacility?.trim(),
    {
      message: "Name the facility or practitioner who referred the patient",
      path: ["referringFacility"],
    }
  )

type RegistrationValues = z.infer<typeof registrationSchema>

const STEP_FIELDS: (keyof RegistrationValues)[][] = [
  [
    "firstName",
    "lastName",
    "gender",
    "dob",
    "bloodGroup",
    "maritalStatus",
    "occupation",
    "vnin",
    "noVnin",
    "ethnicity",
    "religion",
  ],
  ["phone", "email", "addressLine1", "city", "state", "postalCode", "country"],
  ["emergencyName", "emergencyRelationship", "emergencyPhone"],
  ["presentedOnDate", "presentedAtTime", "referralSource", "referringFacility"],
  ["selfPay", "insuranceProvider", "policyNumber", "plan", "validTill"],
  [],
]

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value || "N/A"}</span>
    </div>
  )
}

function PatientRegistrationWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "Male",
      dob: "",
      bloodGroup: "",
      maritalStatus: "Single",
      occupation: "",
      vnin: "",
      noVnin: false,
      ethnicity: "",
      religion: "",
      phone: "",
      email: "",
      addressLine1: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      emergencyName: "",
      emergencyRelationship: "",
      emergencyPhone: "",
      // Left empty and filled after mount — see the effect below.
      presentedOnDate: "",
      presentedAtTime: "",
      referralSource: SELF_REFERRAL,
      referringFacility: "",
      selfPay: false,
      insuranceProvider: "",
      policyNumber: "",
      plan: "Standard",
      validTill: "",
    },
    mode: "onSubmit",
  })

  const selfPay = form.watch("selfPay")
  const noVnin = form.watch("noVnin")
  const referralSource = form.watch("referralSource")
  const isSelfReferral = referralSource === SELF_REFERRAL

  // §4.1 wants the actual date and time the patient presented, and reception
  // should not have to type what the clock already knows. Resolved after mount
  // rather than in defaultValues: formatting "now" during render makes the
  // server's HTML disagree with the browser and React discards the tree.
  useEffect(() => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    form.setValue("presentedOnDate", `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`)
    form.setValue("presentedAtTime", `${pad(now.getHours())}:${pad(now.getMinutes())}`)
    // Runs once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function goNext() {
    const fields = STEP_FIELDS[step]
    const valid = fields.length === 0 ? true : await form.trigger(fields)
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  function onSubmit(values: RegistrationValues) {
    void values
    toast.success("Patient registered successfully", {
      description: "A new medical record number has been generated.",
    })
    router.push("/patients/PAT-0001")
  }

  const values = form.getValues()

  return (
    <div>
      <PageHeader
        title="Patient Registration"
        description="Register a new patient with the front desk intake wizard"
        breadcrumbs={[{ label: "Front Desk" }, { label: "Reception", href: "/reception" }, { label: "Patient Registration" }]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>New Patient Intake</CardTitle>
            <CardDescription>Complete every step to register the patient into Folio Health EMR.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <RegistrationStepper steps={STEPS} currentStep={step} />

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && step < STEPS.length - 1) e.preventDefault()
                }}
              >
                {step === 0 && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input placeholder="Amara" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name</FormLabel>
                          <FormControl>
                            <Input placeholder="Chukwu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "Male")}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bloodGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blood group</FormLabel>
                          <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select blood group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {BLOOD_GROUPS.map((bg) => (
                                <SelectItem key={bg} value={bg}>
                                  {bg}
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
                      name="maritalStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marital status</FormLabel>
                          <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "Single")}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["Single", "Married", "Divorced", "Widowed"].map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
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
                      name="occupation"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Occupation</FormLabel>
                          <FormControl>
                            <Input placeholder="Software Engineer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* §2: VNIN, not the raw NIN, is the linkable identifier. */}
                    <FormField
                      control={form.control}
                      name="vnin"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>VNIN (16 digits)</FormLabel>
                          <FormControl>
                            <Input
                              inputMode="numeric"
                              autoComplete="off"
                              placeholder="1234 5678 9012 3456"
                              disabled={noVnin}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The virtual NIN from the patient&rsquo;s NIMC slip or *346# short code. Folio
                            never stores the raw NIN.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="noVnin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-2 space-y-0 sm:col-span-2">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="cursor-pointer text-sm font-normal text-muted-foreground">
                            Patient has no VNIN today &mdash; register without one
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ethnicity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ethnicity / tribe</FormLabel>
                          <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select ethnicity" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ETHNIC_GROUPS.map((group) => (
                                <SelectItem key={group} value={group}>
                                  {group}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Some conditions are ethnicity-linked.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="religion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Religion</FormLabel>
                          <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select religion" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {RELIGIONS.map((religion) => (
                                <SelectItem key={religion} value={religion}>
                                  {religion}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Recorded so the physician knows going in &mdash; not discovered mid-crisis.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 1 && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone number</FormLabel>
                          <FormControl>
                            <Input placeholder="+234 801 234 5678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email address</FormLabel>
                          <FormControl>
                            <Input placeholder="amara.chukwu@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Street address</FormLabel>
                          <FormControl>
                            <Input placeholder="12 Marina Road" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Lagos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="Lagos State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal code</FormLabel>
                          <FormControl>
                            <Input placeholder="100001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Nigeria" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="emergencyName"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Next of kin full name</FormLabel>
                          <FormControl>
                            <Input placeholder="Ngozi Chukwu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergencyRelationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship</FormLabel>
                          <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"].map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
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
                      name="emergencyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone number</FormLabel>
                          <FormControl>
                            <Input placeholder="+234 802 345 6789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="presentedOnDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of presentation</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="presentedAtTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time of presentation</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormDescription>Prefilled from the clock. Change it if the patient arrived earlier.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="referralSource"
                      render={({ field }) => (
                        <FormItem className={isSelfReferral ? "sm:col-span-2" : undefined}>
                          <FormLabel>Source of referral</FormLabel>
                          <Select value={field.value} onValueChange={(v) => field.onChange(v ?? SELF_REFERRAL)}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {REFERRAL_SOURCES.map((source) => (
                                <SelectItem key={source} value={source}>
                                  {source}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            A referred patient has already been worked up elsewhere &mdash; the physician
                            should not start from zero.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {!isSelfReferral && (
                      <FormField
                        control={form.control}
                        name="referringFacility"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Referring facility or practitioner</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Ikeja PHC" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {step === 4 && (
                  <div className="flex flex-col gap-4">
                    <FormField
                      control={form.control}
                      name="selfPay"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="cursor-pointer text-sm font-normal text-muted-foreground">
                            Patient is self pay (no insurance)
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="insuranceProvider"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>Insurance provider</FormLabel>
                            <FormControl>
                              <Input placeholder="BlueShield Family Plan" disabled={selfPay} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="policyNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Policy number</FormLabel>
                            <FormControl>
                              <Input placeholder="POL-0123456789" disabled={selfPay} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="plan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plan</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(v) => field.onChange(v ?? "Standard")}
                              disabled={selfPay}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {["Basic", "Standard", "Premium", "Family", "Corporate"].map((p) => (
                                  <SelectItem key={p} value={p}>
                                    {p}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="validTill"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valid till</FormLabel>
                            <FormControl>
                              <Input type="date" disabled={selfPay} {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-lg border border-border p-4">
                      <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <UserRoundIcon className="size-4 text-primary" /> Personal Information
                      </p>
                      <SummaryRow label="Name" value={`${values.firstName} ${values.lastName}`.trim()} />
                      <SummaryRow label="Gender" value={values.gender} />
                      <SummaryRow label="Date of birth" value={values.dob} />
                      <SummaryRow label="Blood group" value={values.bloodGroup} />
                      <SummaryRow label="Marital status" value={values.maritalStatus} />
                      <SummaryRow label="Occupation" value={values.occupation} />
                      <SummaryRow
                        label="VNIN"
                        value={values.noVnin ? "Not provided at registration" : (values.vnin ?? "")}
                      />
                      <SummaryRow label="Ethnicity / tribe" value={values.ethnicity} />
                      <SummaryRow label="Religion" value={values.religion} />
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <PhoneIcon className="size-4 text-primary" /> Contact &amp; Address
                      </p>
                      <SummaryRow label="Phone" value={values.phone} />
                      <SummaryRow label="Email" value={values.email} />
                      <SummaryRow
                        label="Address"
                        value={[values.addressLine1, values.city, values.state, values.postalCode, values.country]
                          .filter(Boolean)
                          .join(", ")}
                      />
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <ContactRoundIcon className="size-4 text-primary" /> Next of Kin
                      </p>
                      <SummaryRow label="Name" value={values.emergencyName} />
                      <SummaryRow label="Relationship" value={values.emergencyRelationship} />
                      <SummaryRow label="Phone" value={values.emergencyPhone} />
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <ClipboardCheckIcon className="size-4 text-primary" /> Visit Details
                      </p>
                      <SummaryRow
                        label="Presented"
                        value={[values.presentedOnDate, values.presentedAtTime].filter(Boolean).join(" at ")}
                      />
                      <SummaryRow label="Source of referral" value={values.referralSource} />
                      {values.referralSource !== SELF_REFERRAL && (
                        <SummaryRow label="Referred by" value={values.referringFacility ?? ""} />
                      )}
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <ShieldCheckIcon className="size-4 text-primary" /> Insurance
                      </p>
                      {selfPay ? (
                        <SummaryRow label="Coverage" value="Self pay (no insurance)" />
                      ) : (
                        <>
                          <SummaryRow label="Provider" value={values.insuranceProvider ?? ""} />
                          <SummaryRow label="Policy number" value={values.policyNumber ?? ""} />
                          <SummaryRow label="Plan" value={values.plan ?? ""} />
                          <SummaryRow label="Valid till" value={values.validTill ?? ""} />
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
                  <Button type="button" variant="outline" onClick={goBack} disabled={step === 0}>
                    <ArrowLeftIcon />
                    Back
                  </Button>
                  {step < STEPS.length - 1 ? (
                    <Button type="button" onClick={goNext}>
                      Next
                      <ArrowRightIcon />
                    </Button>
                  ) : (
                    <RoleGate roles={["front-desk", "facility-admin"]}>
                      <Button type="submit">
                        <CheckIcon />
                        Complete Registration
                      </Button>
                    </RoleGate>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="hidden flex-col gap-4 xl:flex">
          <Card className="overflow-hidden py-0">
            <div className="relative h-40 w-full">
              <Image
                src={unsplash(MEDICAL_IMAGES.consultation[0], { w: 600, h: 320 })}
                alt="Front desk patient registration"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <CardContent className="flex flex-col gap-2 pt-4 pb-4">
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <ClipboardCheckIcon className="size-4 text-primary" />
                Step {step + 1} of {STEPS.length}
              </CardTitle>
              <CardDescription>
                {step === 0 && "Capture the patient's core identity details."}
                {step === 1 && "Where can we reach and locate the patient?"}
                {step === 2 && "Who should we contact on the patient's behalf?"}
                {step === 3 && "When did they arrive, and who sent them?"}
                {step === 4 && "Record coverage details for billing."}
                {step === 5 && "Confirm everything looks correct before submitting."}
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export { PatientRegistrationWizard }
