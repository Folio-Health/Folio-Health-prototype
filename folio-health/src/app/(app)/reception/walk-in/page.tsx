import type { Metadata } from "next"
import { WalkInRegistration } from "@/features/reception/components/walk-in-registration"

export const metadata: Metadata = { title: "Walk In Registration" }

export default function WalkInPage() {
  return <WalkInRegistration />
}
