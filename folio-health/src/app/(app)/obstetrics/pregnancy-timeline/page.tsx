import type { Metadata } from "next"
import { PregnancyTimeline } from "@/features/obstetrics/components/pregnancy-timeline"

export const metadata: Metadata = { title: "Pregnancy Timeline" }

export default function ObstetricsPregnancyTimelinePage() {
  return <PregnancyTimeline />
}
