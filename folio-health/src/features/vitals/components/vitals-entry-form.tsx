"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PersonAvatar } from "@/components/common/person-avatar"
import type { Patient } from "@/types/core"

export const vitalsFormSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  bpSystolic: z.number().min(50, "Too low").max(260, "Too high"),
  bpDiastolic: z.number().min(30, "Too low").max(160, "Too high"),
  pulse: z.number().min(30, "Too low").max(220, "Too high"),
  temperature: z.number().min(30, "Too low").max(43, "Too high"),
  respiratoryRate: z.number().min(5, "Too low").max(60, "Too high"),
  spo2: z.number().min(50, "Too low").max(100, "Too high"),
  weight: z.number().min(1, "Too low").max(300, "Too high"),
  height: z.number().min(30, "Too low").max(250, "Too high"),
})

export type VitalsFormValues = z.infer<typeof vitalsFormSchema>

/**
 * Shared vitals-recording form. Used standalone (with a patient picker) from
 * the Vitals hub's "Record Vitals" dialog, and inline (locked to the current
 * patient) from the Consultation workspace's Vitals section.
 */
function VitalsEntryForm({
  patients,
  lockedPatient,
  onSubmit,
  onCancel,
  submitLabel = "Record Vitals",
}: {
  patients?: Patient[]
  lockedPatient?: Patient
  onSubmit: (values: VitalsFormValues) => void
  onCancel?: () => void
  submitLabel?: string
}) {
  const form = useForm<VitalsFormValues>({
    resolver: zodResolver(vitalsFormSchema),
    defaultValues: {
      patientId: lockedPatient?.id ?? patients?.[0]?.id ?? "",
      bpSystolic: 120,
      bpDiastolic: 80,
      pulse: 72,
      temperature: 36.8,
      respiratoryRate: 16,
      spo2: 98,
      weight: lockedPatient?.weight ?? 70,
      height: lockedPatient?.height ?? 170,
    },
  })

  const weight = form.watch("weight")
  const height = form.watch("height")
  const bmi =
    weight && height ? (weight / ((height / 100) * (height / 100))).toFixed(1) : "N/A"

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {lockedPatient ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <PersonAvatar name={lockedPatient.name} seed={lockedPatient.avatarSeed} size="sm" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{lockedPatient.name}</span>
              <span className="text-xs text-muted-foreground">{lockedPatient.mrn}</span>
            </div>
          </div>
        ) : (
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient</FormLabel>
                <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(patients ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} &middot; {p.mrn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="bpSystolic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BP Systolic (mmHg)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bpDiastolic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BP Diastolic (mmHg)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pulse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pulse (bpm)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperature (°C)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="respiratoryRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resp. Rate (/min)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="spo2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SpO2 (%)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height (cm)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2">
          <span className="text-sm text-muted-foreground">Calculated BMI</span>
          <span className="text-sm font-semibold text-foreground">{bmi}</span>
        </div>

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Form>
  )
}

export { VitalsEntryForm }
