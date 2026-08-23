// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import type { StaffMember } from "@/types/core"

/* ------------------------------------------------------------------ */
/* Internal Chat                                                       */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  id: string
  fromMe: boolean
  senderName: string
  body: string
  sentAt: string
}

export interface ChatConversation {
  id: string
  staff: StaffMember
  unreadCount: number
  messages: ChatMessage[]
}

export const CHAT_CONVERSATIONS: ChatConversation[] = []

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

export type AnnouncementAudience = "All Staff" | "Doctors" | "Nurses" | "Administration" | "Pharmacy"

export interface Announcement {
  id: string
  title: string
  body: string
  postedBy: string
  postedByRole: string
  audience: AnnouncementAudience
  postedAt: string
}

export const ANNOUNCEMENTS: Announcement[] = []

/* ------------------------------------------------------------------ */
/* Email Center                                                        */
/* ------------------------------------------------------------------ */

export interface Email {
  id: string
  fromName: string
  fromEmail: string
  subject: string
  preview: string
  body: string
  receivedAt: string
  read: boolean
}

export const EMAILS: Email[] = []

/* ------------------------------------------------------------------ */
/* Support Tickets                                                     */
/* ------------------------------------------------------------------ */

export type TicketPriority = "Low" | "Medium" | "High" | "Urgent"
export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed"

export interface SupportTicket {
  id: string
  subject: string
  category: string
  requesterId: string
  requesterName: string
  priority: TicketPriority
  status: TicketStatus
  assignedToId?: string
  assignedToName?: string
  createdAt: string
}

export const TICKETS: SupportTicket[] = []

export function priorityTone(priority: TicketPriority): "slate" | "blue" | "amber" | "red" {
  switch (priority) {
    case "Low":
      return "slate"
    case "Medium":
      return "blue"
    case "High":
      return "amber"
    case "Urgent":
      return "red"
  }
}
