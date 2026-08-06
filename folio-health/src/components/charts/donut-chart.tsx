"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { ChartTooltipContent } from "./chart-tooltip"

const DEFAULT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
]

export interface DonutSlice {
  label: string
  value: number
  color?: string
}

function DonutChart({
  data,
  size = 180,
  centerLabel,
  centerValue,
}: {
  data: DonutSlice[]
  size?: number
  centerLabel?: string
  centerValue?: string | number
}) {
  const resolved = data.map((d, i) => ({
    ...d,
    color: d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }))
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={resolved}
              dataKey="value"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              cornerRadius={4}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {resolved.map((slice) => (
                <Cell key={slice.label} fill={slice.color} stroke="var(--card)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              // Recharts clamps the tooltip inside the chart's viewBox. On a
              // donut this small that leaves nowhere to put it but on top of
              // the centre label, so let it escape the box and sit clear of
              // the cursor instead.
              allowEscapeViewBox={{ x: true, y: true }}
              offset={16}
              wrapperStyle={{ zIndex: 20, pointerEvents: "none" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const p = payload[0]
                const value = Number(p.value)
                return (
                  <ChartTooltipContent
                    rows={[
                      {
                        label: String(p.name),
                        value: `${value} (${total ? Math.round((value / total) * 100) : 0}%)`,
                        color: String(p.payload.color),
                      },
                    ]}
                  />
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {(centerLabel || centerValue !== undefined) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {centerValue !== undefined && (
              <span className="text-xl font-semibold text-foreground">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-xs text-muted-foreground">{centerLabel}</span>
            )}
          </div>
        )}
      </div>
      {/* min-w-0 so the legend can shrink inside a narrow card instead of
          overflowing and clipping its labels mid-word. */}
      <div className="flex w-full min-w-0 flex-col gap-2.5">
        {resolved.map((slice) => (
          <div key={slice.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate">{slice.label}</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums text-foreground">
              {slice.value} · {total ? Math.round((slice.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { DonutChart }
