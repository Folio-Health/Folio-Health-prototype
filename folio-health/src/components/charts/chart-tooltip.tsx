"use client"

interface TooltipRow {
  label: string
  value: string | number
  color: string
}

/** Shared Recharts tooltip content: value leads (bold), series name follows (muted), keyed by a short line stroke rather than a filled box. */
function ChartTooltipContent({
  title,
  rows,
}: {
  title?: string
  rows: TooltipRow[]
}) {
  if (rows.length === 0) return null

  return (
    <div className="min-w-36 rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      {title && <p className="mb-1.5 text-xs font-medium text-muted-foreground">{title}</p>}
      <div className="flex flex-col gap-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="h-0.5 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              {row.label}
            </span>
            <span className="font-semibold tabular-nums text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { ChartTooltipContent }
export type { TooltipRow }
