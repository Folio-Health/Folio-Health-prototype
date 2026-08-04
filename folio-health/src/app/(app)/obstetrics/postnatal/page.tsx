import type { Metadata } from "next"
import { PostnatalCare } from "@/features/obstetrics/components/postnatal-care"

export const metadata: Metadata = { title: "Postnatal Care" }

export default function ObstetricsPostnatalPage() {
  return <PostnatalCare />
}
