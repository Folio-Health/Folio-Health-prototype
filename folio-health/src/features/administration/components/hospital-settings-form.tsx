"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { SaveIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { PhoneIcon, MailIcon, GlobeIcon, MapPinIcon, ClockIcon, HospitalIcon } from "lucide-react"
import { AdministrationModuleTabs } from "./administration-module-tabs"

const hospitalSettingsSchema = z.object({
  name: z.string().min(1, "Hospital name is required"),
  tagline: z.string().max(140, "Keep the tagline under 140 characters").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  website: z.string().optional().or(z.literal("")),
  operatingHours: z.string().min(1, "Operating hours are required"),
})

type HospitalSettingsValues = z.infer<typeof hospitalSettingsSchema>

function HospitalSettingsForm() {
  const form = useForm<HospitalSettingsValues>({
    resolver: zodResolver(hospitalSettingsSchema),
    defaultValues: {
      name: "Folio Health Medical Centre",
      tagline: "Compassionate care, advanced medicine.",
      address: "14 Ademola Adetokunbo Crescent, Wuse II, Abuja, Nigeria",
      phone: "+234 803 123 4567",
      email: "info@foliohealth.example",
      website: "https://foliohealth.example",
      operatingHours: "Mon to Fri: 7:00 AM to 9:00 PM · Sat to Sun: 8:00 AM to 6:00 PM · Emergency: 24/7",
    },
  })

  function onSubmit(values: HospitalSettingsValues) {
    void values
    toast.success("Hospital settings saved", {
      description: "Your changes have been applied across the system.",
    })
  }

  return (
    <div>
      <PageHeader
        title="Hospital Settings"
        description="Manage the hospital's public profile and contact information"
        breadcrumbs={[{ label: "System" }, { label: "Administration" }, { label: "Hospital Settings" }]}
      />

      <AdministrationModuleTabs />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>How the hospital is identified across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hospital Name</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon>
                          <HospitalIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput placeholder="Folio Health Medical Centre" {...field} />
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A short tagline for the hospital" rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact & Location</CardTitle>
              <CardDescription>How patients and partners can reach the hospital.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon>
                          <MapPinIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput placeholder="Street, city, state, country" {...field} />
                      </InputGroup>
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
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupAddon>
                            <PhoneIcon className="size-4" />
                          </InputGroupAddon>
                          <InputGroupInput placeholder="+234 800 000 0000" {...field} />
                        </InputGroup>
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupAddon>
                            <MailIcon className="size-4" />
                          </InputGroupAddon>
                          <InputGroupInput placeholder="info@hospital.example" {...field} />
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon>
                          <GlobeIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput placeholder="https://hospital.example" {...field} />
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operating Hours</CardTitle>
              <CardDescription>Displayed to patients on the portal and appointment pages.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="operatingHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon>
                          <ClockIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput placeholder="Mon to Fri: 8AM to 6PM" {...field} />
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg">
              <SaveIcon />
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export { HospitalSettingsForm }
