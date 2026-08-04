import { cn } from "@/lib/utils"

type Tone = "green" | "amber" | "red" | "blue" | "slate" | "violet" | "cyan"

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  red: "bg-red-500/10 text-red-700 dark:text-red-400",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  slate: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  cyan: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
}

const DOT_CLASSES: Record<Tone, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  slate: "bg-slate-400",
  violet: "bg-violet-500",
  cyan: "bg-cyan-500",
}

/** Normalized status string -> tone. Covers the status vocabularies used across modules. */
const STATUS_TONES: Record<string, Tone> = {
  // generic
  active: "green",
  inactive: "slate",
  archived: "slate",
  deceased: "slate",
  "on leave": "amber",
  suspended: "red",
  // appointments / queue
  scheduled: "blue",
  "checked in": "cyan",
  "in progress": "amber",
  completed: "green",
  cancelled: "red",
  "no show": "red",
  waiting: "amber",
  // clinical / lab / results
  normal: "green",
  abnormal: "amber",
  critical: "red",
  pending: "amber",
  approved: "green",
  rejected: "red",
  // pharmacy / inventory
  dispensed: "green",
  "to dispense": "amber",
  "low stock": "amber",
  "out of stock": "red",
  "in stock": "green",
  expired: "red",
  expiring: "amber",
  // billing
  paid: "green",
  partial: "amber",
  unpaid: "red",
  overdue: "red",
  refunded: "slate",
  // beds / wards
  available: "green",
  occupied: "blue",
  reserved: "violet",
  cleaning: "amber",
  // surgery / admissions
  discharged: "slate",
  admitted: "blue",
  // tickets / tasks
  open: "blue",
  closed: "slate",
  resolved: "green",
  draft: "slate",
  published: "green",
}

function toneForStatus(status: string): Tone {
  return STATUS_TONES[status.trim().toLowerCase()] ?? "slate"
}

function StatusBadge({
  status,
  className,
  tone,
}: {
  status: string
  className?: string
  tone?: Tone
}) {
  const resolvedTone = tone ?? toneForStatus(status)

  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[resolvedTone],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT_CLASSES[resolvedTone])} />
      {status}
    </span>
  )
}

export { StatusBadge, toneForStatus }
export type { Tone as StatusTone }
