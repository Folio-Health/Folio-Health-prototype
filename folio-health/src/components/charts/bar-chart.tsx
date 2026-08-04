"use client"

import { Bar, BarChart as ReBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChartTooltipContent } from "./chart-tooltip"
import { ChartLegend, type ChartSeries } from "./chart-legend"

const DEFAULT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

function BarChart({
  data,
  series,
  xKey,
  height = 260,
  layout = "vertical",
  yFormatter,
}: {
  data: Record<string, string | number>[]
  series: ChartSeries[]
  xKey: string
  height?: number
  /** "vertical" = bars grow upward from a horizontal x-axis (the common case) */
  layout?: "vertical" | "horizontal"
  yFormatter?: (value: number) => string
}) {
  const resolved = series.map((s, i) => ({
    ...s,
    color: s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }))

  return (
    <div className="flex flex-col gap-3">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <ReBarChart
            data={data}
            layout={layout === "vertical" ? "horizontal" : "vertical"}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="0" vertical={layout !== "vertical"} horizontal={layout === "vertical"} stroke="var(--border)" />
            {layout === "vertical" ? (
              <>
                <XAxis
                  dataKey={xKey}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  width={36}
                  tickFormatter={yFormatter}
                />
              </>
            ) : (
              <>
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickFormatter={yFormatter}
                />
                <YAxis
                  type="category"
                  dataKey={xKey}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  width={96}
                />
              </>
            )}
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              content={({ active, label, payload }) => {
                if (!active || !payload?.length) return null
                return (
                  <ChartTooltipContent
                    title={String(label)}
                    rows={payload.map((p) => ({
                      label: resolved.find((s) => s.key === p.dataKey)?.label ?? String(p.dataKey),
                      value: yFormatter ? yFormatter(Number(p.value)) : String(p.value),
                      color: String(p.color),
                    }))}
                  />
                )
              }}
            />
            {resolved.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                fill={s.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
            ))}
          </ReBarChart>
        </ResponsiveContainer>
      </div>
      {resolved.length > 1 && <ChartLegend series={resolved} />}
    </div>
  )
}

export { BarChart }
