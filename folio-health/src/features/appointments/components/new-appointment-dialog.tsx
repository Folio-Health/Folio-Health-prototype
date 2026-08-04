"use client"

import { useState } from "react"
import { toast } from "sonner"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AppointmentForm, type AppointmentFormValues } from "./appointment-form"

function NewAppointmentDialog() {
  const [open, setOpen] = useState(false)

  function handleSubmit(values: AppointmentFormValues) {
    void values
    setOpen(false)
    toast.success("Appointment booked successfully")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        New Appointment
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>Schedule a new patient appointment.</DialogDescription>
        </DialogHeader>
        <AppointmentForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

export { NewAppointmentDialog }
