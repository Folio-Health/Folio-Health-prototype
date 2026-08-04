import type { Metadata } from "next"
import { GrowthCharts } from "@/features/pediatrics/components/growth-charts"

export const metadata: Metadata = { title: "Growth Charts" }

export default function PediatricsGrowthChartsPage() {
  return <GrowthCharts />
}
