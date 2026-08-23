"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import type { Patient as FhirPatient } from "@medplum/fhirtypes"
import { ageFromBirthDate } from "@/lib/fhir/patient"
import { registerPatient } from "../lib/register-patient"
import { phoneSchema, phoneInputProps, sanitizePhoneInput } from "@/lib/phone"
import { NIN_SYSTEM, ninInputProps, optionalNinSchema, sanitizeNinInput } from "@/lib/identifiers"
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

const STEPS = ["Personal Info", "Contact & Address", "Emergency Contact", "Insurance", "Review"]

const registrationSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    gender: z.enum(["Male", "Female", "Other"]),
    dob: z.string().min(1, "Date of birth is required"),
    bloodGroup: z.string().min(1, "Blood group is required"),
    maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]),
    occupation: z.string().min(1, "Occupation is required"),
    // Optional by design: registration is never blocked for lack of a NIN —
    // when present it becomes an identifier and powers duplicate checking.
    nin: optionalNinSchema,

    phone: phoneSchema,
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    addressLine1: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),

    emergencyName: z.string().min(1, "Contact name is required"),
    emergencyRelationship: z.string().min(1, "Relationship is required"),
    emergencyPhone: phoneSchema,

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

type RegistrationValues = z.infer<typeof registrationSchema>

const STEP_FIELDS: (keyof RegistrationValues)[][] = [
  ["firstName", "lastName", "gender", "dob", "bloodGroup", "maritalStatus", "occupation", "nin"],
  ["phone", "email", "addressLine1", "city", "state", "postalCode", "country"],
  ["emergencyName", "emergencyRelationship", "emergencyPhone"],
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
      nin: "",
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
      selfPay: false,
      insuranceProvider: "",
      policyNumber: "",
      plan: "Standard",
      validTill: "",
    },
    mode: "onSubmit",
  })

  const selfPay = form.watch("selfPay")

  async function goNext() {
    const fields = STEP_FIELDS[step]
    const valid = fields.length === 0 ? true : await form.trigger(fields)
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  const [submitting, setSubmitting] = useState(false)

  /**
   * Creates the REAL FHIR Patient and lands on its actual record. This used to
   * show a success toast, discard the form, and redirect to a hardcoded
   * "PAT-0001" — a fabricated flow that registered nobody.
   *
   * Insurance details are collected but not yet persisted (no Coverage
   * resource is modelled server-side yet); the toast says what was saved.
   */
  async function onSubmit(values: RegistrationValues) {
    setSubmitting(true)
    try {
      const created = await registerPatient({
        resourceType: "Patient",
        active: true,
        name: [{ given: [values.firstName], family: values.lastName }],
        gender: values.gender.toLowerCase() as FhirPatient["gender"],
        birthDate: values.dob,
        maritalStatus: { text: values.maritalStatus },
        ...(values.nin ? { identifier: [{ system: NIN_SYSTEM, value: values.nin }] } : {}),
        telecom: [
          { system: "phone", value: values.phone },
          { system: "email", value: values.email },
        ],
        address: [
          {
            line: [values.addressLine1],
            city: values.city,
            state: values.state,
            postalCode: values.postalCode,
            country: values.country,
          },
        ],
        contact: [
          {
            name: { text: values.emergencyName },
            relationship: [{ text: values.emergencyRelationship }],
            telecom: [{ system: "phone", value: values.emergencyPhone }],
          },
        ],
        extension: [
          { url: "https://folio.health/fhir/StructureDefinition/blood-group", valueString: values.bloodGroup },
          { url: "https://folio.health/fhir/StructureDefinition/occupation", valueString: values.occupation },
        ],
      })
      toast.success("Patient registered", {
        description: values.selfPay
          ? "Demographics and contacts saved to their record."
          : "Demographics and contacts saved. Insurance details are not stored yet — coverage isn't modelled server-side.",
      })
      router.push(`/patients/${created.id}`)
    } catch (error) {
      toast.error("Could not register the patient", {
        description: error instanceof Error ? error.message : "Check your connection and try again.",
      })
    } finally {
      setSubmitting(false)
    }
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
                    <FormField
                      control={form.control}
                      name="nin"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>National Identification Number (NIN)</FormLabel>
                          <FormControl>
                            <Input
                              {...ninInputProps}
                              {...field}
                              onChange={(e) => field.onChange(sanitizeNinInput(e.target.value))}
                            />
                          </FormControl>
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
                            <Input
                              {...phoneInputProps}
                              {...field}
                              onChange={(e) => field.onChange(sanitizePhoneInput(e.target.value))}
                            />
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
                          <FormLabel>Contact full name</FormLabel>
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
                            <Input
                              {...phoneInputProps}
                              {...field}
                              onChange={(e) => field.onChange(sanitizePhoneInput(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 3 && (
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

                {step === 4 && (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-lg border border-border p-4">
                      <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <UserRoundIcon className="size-4 text-primary" /> Personal Information
                      </p>
                      <SummaryRow label="Name" value={`${values.firstName} ${values.lastName}`.trim()} />
                      <SummaryRow label="Gender" value={values.gender} />
                      <SummaryRow label="Date of birth" value={values.dob} />
                      <SummaryRow
                        label="Age"
                        value={(() => {
                          const age = ageFromBirthDate(values.dob)
                          return age !== undefined ? `${age} ${age === 1 ? "year" : "years"}` : ""
                        })()}
                      />
                      <SummaryRow label="NIN" value={values.nin || "Not provided"} />
                      <SummaryRow label="Blood group" value={values.bloodGroup} />
                      <SummaryRow label="Marital status" value={values.maritalStatus} />
                      <SummaryRow label="Occupation" value={values.occupation} />
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
                        <ContactRoundIcon className="size-4 text-primary" /> Emergency Contact
                      </p>
                      <SummaryRow label="Name" value={values.emergencyName} />
                      <SummaryRow label="Relationship" value={values.emergencyRelationship} />
                      <SummaryRow label="Phone" value={values.emergencyPhone} />
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
                      <Button type="submit" disabled={submitting}>
                        <CheckIcon />
                        {submitting ? "Registering…" : "Complete Registration"}
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
                {step === 2 && "Who should we contact in an emergency?"}
                {step === 3 && "Record coverage details for billing."}
                {step === 4 && "Confirm everything looks correct before submitting."}
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export { PatientRegistrationWizard }
