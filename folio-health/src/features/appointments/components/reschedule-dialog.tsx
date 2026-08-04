"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { Appointment } from "@/types/core"

const rescheduleSchema = z.object({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
})

type RescheduleValues = z.infer<typeof rescheduleSchema>

/**
 * Controlled reschedule dialog — no internal trigger, so it can be driven
 * both from a page-level button (appointment detail) and a table row's
 * `⋯` action menu (appointments-table-view).
 */
function RescheduleDialog({
  appointment,
  open,
  onOpenChange,
  onRescheduled,
}: {
  appointment: Appointment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRescheduled?: (values: RescheduleValues) => void
}) {
  const form = useForm<RescheduleValues>({
    resolver: zodResolver(rescheduleSchema),
    values: appointment
      ? {
          date: appointment.date,
          time: new Date(appointment.startTime).toISOString().slice(11, 16),
        }
      : { date: "", time: "" },
  })

  function handleSubmit(values: RescheduleValues) {
    onOpenChange(false)
    onRescheduled?.(values)
    toast.success("Appointment rescheduled successfully")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Choose a new date and time for this appointment.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="-mx-0 -mb-0 mt-2 border-t-0 bg-transparent p-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Confirm Reschedule</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export { RescheduleDialog }
