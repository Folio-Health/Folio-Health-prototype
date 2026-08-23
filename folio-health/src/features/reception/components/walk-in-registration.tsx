"use client"

import { useState } from "react"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import type { Patient as FhirPatient } from "@medplum/fhirtypes"
import { registerPatient } from "../lib/register-patient"
import { phoneSchema, phoneInputProps, sanitizePhoneInput } from "@/lib/phone"
import { ZapIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { RoleGate } from "@/components/common/role-gate"

const walkInSchema = z.object({
  name: z.string().min(1, "Patient name is required"),
  phone: phoneSchema,
  gender: z.enum(["Male", "Female", "Other"]),
  dob: z.string().min(1, "Date of birth is required"),
  reason: z.string().min(1, "Reason for visit is required"),
})

type WalkInValues = z.infer<typeof walkInSchema>

function WalkInRegistration() {
  const router = useRouter()

  const form = useForm<WalkInValues>({
    resolver: zodResolver(walkInSchema),
    defaultValues: { name: "", phone: "", gender: "Male", dob: "", reason: "" },
  })

  const [submitting, setSubmitting] = useState(false)

  /**
   * Creates the REAL FHIR Patient (this used to fake a toast and redirect to a
   * hardcoded id). There is no queue data model yet, so no queue claim is
   * made; the reason for visit is kept as a note on the record.
   */
  async function onSubmit(values: WalkInValues) {
    setSubmitting(true)
    const parts = values.name.trim().split(/\s+/)
    const family = parts.length > 1 ? (parts.pop() as string) : ""
    try {
      const created = await registerPatient({
        resourceType: "Patient",
        active: true,
        name: [{ given: parts, ...(family ? { family } : {}), text: values.name.trim() }],
        gender: values.gender.toLowerCase() as FhirPatient["gender"],
        birthDate: values.dob,
        telecom: [{ system: "phone", value: values.phone }],
        extension: [
          { url: "https://folio.health/fhir/StructureDefinition/visit-reason", valueString: values.reason },
        ],
      })
      toast.success("Walk-in patient registered", {
        description: "Their record is ready — opening it now.",
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

  return (
    <div>
      <PageHeader
        title="Walk In Registration"
        description="Fast single page intake for unscheduled walk in visits"
        breadcrumbs={[{ label: "Front Desk" }, { label: "Reception", href: "/reception" }, { label: "Walk In Registration" }]}
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ZapIcon className="size-4.5" />
          </div>
          <CardTitle className="mt-2">Quick Walk In Intake</CardTitle>
          <CardDescription>Capture the essentials now. A full profile can be completed later.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Tunde Bakare" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              </div>
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for visit</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Briefly describe why the patient is here today" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="mt-2 flex items-center justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  Clear
                </Button>
                <RoleGate roles={["front-desk", "facility-admin"]}>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Registering…" : "Register Patient"}
                  </Button>
                </RoleGate>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export { WalkInRegistration }
