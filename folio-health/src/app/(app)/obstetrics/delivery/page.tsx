import type { Metadata } from "next"
import { DeliveryRecords } from "@/features/obstetrics/components/delivery-records"

export const metadata: Metadata = { title: "Delivery Records" }

export default function ObstetricsDeliveryPage() {
  return <DeliveryRecords />
}
