import type { Metadata } from "next"
import { MarList } from "@/features/nursing/components/mar-list"

export const metadata: Metadata = { title: "Medication Administration Record" }

export default function NursingMarPage() {
  return <MarList />
}
