"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartTooltipContent } from "./chart-tooltip"
import { ChartLegend, type ChartSeries } from "./chart-legend"

const DEFAULT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

function TrendChart({
  data,
  series,
  xKey,
  type = "area",
  height = 260,
  yFormatter,
}: {
  data: Record<string, string | number>[]
  series: ChartSeries[]
  xKey: string
  type?: "area" | "line"
  height?: number
  yFormatter?: (value: number) => string
}) {
  const resolved = series.map((s, i) => ({
    ...s,
    color: s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }))
  const Chart = type === "area" ? AreaChart : LineChart

  return (
    <div className="flex flex-col gap-3">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <Chart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              {resolved.map((s) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.16} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="0"
              vertical={false}
              stroke="var(--border)"
            />
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
            <Tooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
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
            {resolved.map((s) =>
              type === "area" ? (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#fill-${s.key})`}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                  isAnimationActive={false}
                />
              ) : (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                  isAnimationActive={false}
                />
              )
            )}
          </Chart>
        </ResponsiveContainer>
      </div>
      {resolved.length > 1 && <ChartLegend series={resolved} />}
    </div>
  )
}

export { TrendChart }
