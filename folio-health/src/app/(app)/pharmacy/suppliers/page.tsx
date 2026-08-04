import type { Metadata } from "next"
import { SuppliersList } from "@/features/pharmacy/components/suppliers-list"

export const metadata: Metadata = { title: "Pharmacy Suppliers" }

export default function PharmacySuppliersPage() {
  return <SuppliersList />
}
