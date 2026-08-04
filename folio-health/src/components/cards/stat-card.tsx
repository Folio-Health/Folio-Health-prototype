import type { LucideIcon } from "lucide-react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkline } from "@/components/charts/sparkline"
import { cn } from "@/lib/utils"

export interface StatDelta {
  value: number
  /** Whether an "up" movement should read as good (green) or bad (red). */
  isGoodWhenUp?: boolean
  comparedTo?: string
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  sparklineData,
  tone = "primary",
  className,
}: {
  label: string
  value: string | number
  icon?: LucideIcon
  delta?: StatDelta
  sparklineData?: number[]
  tone?: "primary" | "emerald" | "amber" | "red" | "violet" | "cyan"
  className?: string
}) {
  const isGoodWhenUp = delta?.isGoodWhenUp ?? true
  const isUp = (delta?.value ?? 0) >= 0
  const isPositive = isUp ? isGoodWhenUp : !isGoodWhenUp

  const toneClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  }

  return (
    <Card className={cn("gap-3", className)}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          {Icon && (
            <div className={cn("flex size-9 items-center justify-center rounded-lg", toneClasses[tone])}>
              <Icon className="size-4.5" />
            </div>
          )}
        </div>
        <div className="flex items-end justify-between gap-3">
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {typeof value === "number" ? formatCompact(value) : value}
          </p>
          {sparklineData && sparklineData.length > 1 && (
            <div className="w-20">
              <Sparkline
                data={sparklineData}
                color={isPositive ? "var(--status-good)" : "var(--status-critical)"}
              />
            </div>
          )}
        </div>
        {delta && (
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                isPositive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-500/10 text-red-700 dark:text-red-400"
              )}
            >
              {isUp ? (
                <ArrowUpIcon className="size-3" />
              ) : (
                <ArrowDownIcon className="size-3" />
              )}
              {Math.abs(delta.value)}%
            </span>
            {delta.comparedTo && (
              <span className="text-muted-foreground">vs {delta.comparedTo}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { StatCard }
