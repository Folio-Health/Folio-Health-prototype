import type { Metadata } from "next"
import { TicketsList } from "@/features/communication/components/tickets-list"

export const metadata: Metadata = { title: "Support Tickets" }

export default function CommunicationTicketsPage() {
  return <TicketsList />
}
