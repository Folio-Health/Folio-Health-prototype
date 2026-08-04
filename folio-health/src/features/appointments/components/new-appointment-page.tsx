"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AppointmentForm, type AppointmentFormValues } from "./appointment-form"

function NewAppointmentPage() {
  const router = useRouter()

  function handleSubmit(values: AppointmentFormValues) {
    void values
    toast.success("Appointment booked successfully")
    router.push("/appointments")
  }

  return (
    <div>
      <PageHeader
        title="New Appointment"
        description="Schedule a new patient appointment"
        breadcrumbs={[
          { label: "Front Desk" },
          { label: "Appointments", href: "/appointments" },
          { label: "New" },
        ]}
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
          <CardDescription>Fill in the details below to book a new appointment.</CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentForm onSubmit={handleSubmit} onCancel={() => router.push("/appointments")} />
        </CardContent>
      </Card>
    </div>
  )
}

export { NewAppointmentPage }
