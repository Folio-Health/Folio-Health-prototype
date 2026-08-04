export interface ChartSeries {
  key: string
  label: string
  color?: string
}

/** Legend for 2+ series — the dependable identity channel; a single series relies on the card title instead. */
function ChartLegend({ series }: { series: ChartSeries[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {series.map((s) => (
        <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: s.color }}
          />
          {s.label}
        </div>
      ))}
    </div>
  )
}

export { ChartLegend }
