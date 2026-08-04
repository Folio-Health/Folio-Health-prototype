import { faker } from "@faker-js/faker"
import { seedFaker, pick, pickWeighted, id } from "./seed"
import { STAFF } from "./staff"
import type { StaffMember } from "@/types/core"

seedFaker(61)

const NOW = new Date()
const CURRENT_USER_NAME = "You"

const ADMIN_STAFF = STAFF.filter((s) => s.role === "Administrator" || s.role === "Hospital Management")

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

const INBOUND_LINES = [
  "Can you review the vitals I just charted for bed 4?",
  "Following up on the lab request from this morning.",
  "Patient in ward B is asking for a status update on discharge.",
  "Do you have a minute to go over the handover notes?",
  "The pharmacy flagged a possible interaction, can you confirm the order?",
  "Radiology report just came back, worth a look before rounds.",
  "Shift change in 20 minutes, anything I should flag?",
  "Thanks for covering my rounds earlier, really appreciated it.",
  "Can we push the case review meeting to 3pm?",
  "The new triage protocol doc is ready for your sign off.",
]

const OUTBOUND_LINES = [
  "Sure, give me a few minutes and I'll take a look.",
  "Got it, thanks for the heads up.",
  "I'll check in with the patient right now.",
  "Yes, let's sync after the morning huddle.",
  "Confirmed, please proceed with the revised dosage.",
  "Reviewed, looks good. Nice catch.",
  "Nothing major from my side, all stable.",
  "Anytime, happy to help.",
  "3pm works for me, I'll update the calendar.",
  "Reviewed and signed off, thanks for putting this together.",
]

function buildConversation(staff: StaffMember, index: number): ChatConversation {
  const messageCount = faker.number.int({ min: 4, max: 9 })
  const messages: ChatMessage[] = []
  let cursor = faker.number.int({ min: 20, max: 6000 })

  for (let i = 0; i < messageCount; i++) {
    const fromMe = i % 2 === 1
    cursor -= faker.number.int({ min: 3, max: 90 })
    messages.push({
      id: id(`MSG${index}`, i + 1),
      fromMe,
      senderName: fromMe ? CURRENT_USER_NAME : staff.name,
      body: fromMe ? pick(OUTBOUND_LINES) : pick(INBOUND_LINES),
      sentAt: new Date(NOW.getTime() - Math.max(cursor, 1) * 60 * 1000).toISOString(),
    })
  }

  const unreadCount = faker.number.float({ min: 0, max: 1 }) > 0.62 ? faker.number.int({ min: 1, max: 4 }) : 0

  return {
    id: id("CONV", index + 1),
    staff,
    unreadCount,
    messages,
  }
}

const CHAT_PARTICIPANTS = faker.helpers.arrayElements(STAFF, 12)

export const CHAT_CONVERSATIONS: ChatConversation[] = CHAT_PARTICIPANTS.map((staff, i) =>
  buildConversation(staff, i)
).sort(
  (a, b) =>
    new Date(b.messages[b.messages.length - 1].sentAt).getTime() -
    new Date(a.messages[a.messages.length - 1].sentAt).getTime()
)

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

const ANNOUNCEMENT_SEEDS: { title: string; body: string; audience: AnnouncementAudience }[] = [
  {
    title: "Updated Hand Hygiene Protocol",
    body: "Effective immediately, all clinical staff must follow the revised 7 step hand hygiene protocol posted in every ward. Compliance audits begin next week, please review the updated poster near each handwashing station.",
    audience: "All Staff",
  },
  {
    title: "EMR Scheduled Downtime This Weekend",
    body: "The EMR system will be unavailable for scheduled maintenance from Saturday 11:00 PM to Sunday 4:00 AM. Please switch to the downtime paper charting procedure during this window and enter records after the fact once systems are restored.",
    audience: "All Staff",
  },
  {
    title: "Annual Flu Vaccination Drive",
    body: "Free flu vaccinations are available for all staff at the Occupational Health office through the end of the month. Walk ins welcome; no appointment required. Please encourage your teams to participate.",
    audience: "All Staff",
  },
  {
    title: "New Controlled Substance Sign Off Procedure",
    body: "Starting Monday, all controlled substance dispensing requires dual sign off from a pharmacist and the prescribing physician. Updated forms are available in the pharmacy portal.",
    audience: "Pharmacy",
  },
  {
    title: "Revised Nurse Shift Handover Checklist",
    body: "A revised shift handover checklist is now mandatory for all wards to improve continuity of care. Please review the new SBAR based template shared in the nursing shared drive.",
    audience: "Nurses",
  },
  {
    title: "Grand Rounds Schedule Change",
    body: "Weekly grand rounds are moving from Thursday 8:00 AM to Wednesday 7:30 AM starting next month to accommodate the new resident teaching schedule.",
    audience: "Doctors",
  },
  {
    title: "Fire Drill Scheduled for Building B",
    body: "A hospitalwide fire drill will be conducted in Building B next Tuesday at 10:00 AM. Please review evacuation routes with your teams ahead of time and ensure patients are informed where appropriate.",
    audience: "All Staff",
  },
  {
    title: "Q3 Budget Review Meeting",
    body: "Department heads are required to submit Q3 budget variance reports by end of week ahead of the executive review meeting. Templates have been circulated by the finance office.",
    audience: "Administration",
  },
  {
    title: "Staff Appreciation Week",
    body: "Join us next week for Staff Appreciation Week: daily raffles, a catered lunch on Wednesday, and recognition awards at Friday's town hall. Thank you for everything you do for our patients.",
    audience: "All Staff",
  },
]

export const ANNOUNCEMENTS: Announcement[] = ANNOUNCEMENT_SEEDS.map((seed, i) => {
  const poster = pick(ADMIN_STAFF.length > 0 ? ADMIN_STAFF : STAFF)
  return {
    id: id("ANN", i + 1),
    title: seed.title,
    body: seed.body,
    postedBy: poster.name,
    postedByRole: poster.title,
    audience: seed.audience,
    postedAt: faker.date.recent({ days: 30 + i * 3 }).toISOString(),
  }
}).sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())

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

const EMAIL_SEEDS: { subject: string; preview: string; body: string }[] = [
  {
    subject: "Lab results ready for review: PT-1042",
    preview: "The complete blood count panel for your patient is now available in the system.",
    body: "The complete blood count panel for patient PT-1042 is now available in the system. Potassium levels are flagged as critical, please review as soon as possible and advise on next steps.",
  },
  {
    subject: "Meeting invite: Department heads sync",
    preview: "Please confirm your attendance for the monthly department heads sync on Thursday.",
    body: "You're invited to the monthly department heads sync this Thursday at 2:00 PM in Conference Room A. Agenda includes budget review, staffing updates, and the new patient flow initiative. Please confirm your attendance.",
  },
  {
    subject: "Vendor invoice: MedSupply Nigeria Ltd.",
    preview: "Attached is invoice #INV-88213 for the quarterly medical supplies order.",
    body: "Please find attached invoice #INV-88213 for the quarterly medical supplies order, due within 30 days. Contact our accounts team if you have any questions regarding line items.",
  },
  {
    subject: "Continuing education credits reminder",
    preview: "You have until the end of the quarter to complete your required CE credits.",
    body: "This is a reminder that you have until the end of the quarter to complete your required continuing education credits. You currently have 6 of 20 hours logged. Visit the training portal to enroll in available courses.",
  },
  {
    subject: "Patient transfer request: St. Mary's Hospital",
    preview: "We would like to coordinate a transfer for a patient requiring cardiac catheterization.",
    body: "St. Mary's Hospital is requesting to coordinate a transfer for a patient requiring cardiac catheterization, which is not available at their facility. Please advise on bed availability and the earliest possible admission time.",
  },
  {
    subject: "Updated on call schedule: August",
    preview: "The on call rotation for next month has been finalized, please review your assigned dates.",
    body: "The on call rotation for August has been finalized. Please review your assigned dates in the attached schedule and flag any conflicts with the coordinator by end of week.",
  },
  {
    subject: "Equipment maintenance notice: MRI Suite 2",
    preview: "MRI Suite 2 will be offline for scheduled maintenance next Monday.",
    body: "MRI Suite 2 will be offline for scheduled preventive maintenance next Monday from 6:00 AM to 12:00 PM. Please reschedule any imaging appointments during this window to Suite 1 or the following day.",
  },
  {
    subject: "Insurance preauthorization approved",
    preview: "Preauthorization for the requested procedure has been approved by the insurer.",
    body: "Preauthorization for the requested procedure has been approved by NHIS. Approval reference and coverage details are attached. Please proceed with scheduling at your earliest convenience.",
  },
  {
    subject: "Welcome to Folio Health: onboarding checklist",
    preview: "Here's your onboarding checklist for your first two weeks with us.",
    body: "Welcome to Folio Health! Attached is your onboarding checklist covering system access, mandatory training modules, and your orientation schedule for the first two weeks. Reach out to HR with any questions.",
  },
  {
    subject: "Follow up: Infection control audit findings",
    preview: "Summary of findings from last week's infection control audit is ready.",
    body: "Attached is the summary of findings from last week's infection control audit. Overall compliance was strong, with two minor corrective actions required in the ICU supply room. Please review and acknowledge by Friday.",
  },
  {
    subject: "Payroll: updated timesheet deadline",
    preview: "Timesheets for this pay period are now due one day earlier than usual.",
    body: "Please note that timesheets for this pay period are due one day earlier than usual due to the upcoming public holiday. Submit by Wednesday 5:00 PM to ensure timely processing.",
  },
  {
    subject: "New clinical guideline: Sepsis bundle update",
    preview: "The sepsis management bundle has been updated in line with the latest guidance.",
    body: "The sepsis management bundle has been updated in line with the latest clinical guidance, including revised lactate recheck intervals. Please review the updated protocol before your next shift.",
  },
]

export const EMAILS: Email[] = EMAIL_SEEDS.map((seed, i) => {
  const sender = pick(STAFF)
  return {
    id: id("EML", i + 1),
    fromName: sender.name,
    fromEmail: sender.email,
    subject: seed.subject,
    preview: seed.preview,
    body: seed.body,
    receivedAt: faker.date.recent({ days: 20 + i * 2 }).toISOString(),
    read: i > 2,
  }
}).sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())

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

const TICKET_SEEDS: { subject: string; category: string }[] = [
  { subject: "Cannot log in to EMR workstation", category: "IT Support" },
  { subject: "Printer in Radiology jammed again", category: "Facilities" },
  { subject: "Request access to Cardiology shared drive", category: "IT Support" },
  { subject: "Patient monitor in Bay 3 showing error code", category: "Biomedical" },
  { subject: "Air conditioning not working in Ward C", category: "Facilities" },
  { subject: "Barcode scanner not reading wristbands", category: "IT Support" },
  { subject: "Request new badge access for night shift", category: "Security" },
  { subject: "WiFi drops intermittently in ICU", category: "IT Support" },
  { subject: "Broken wheel on transport bed #14", category: "Facilities" },
  { subject: "Need additional monitor for nurses station", category: "IT Support" },
  { subject: "Autoclave in sterilization not reaching temp", category: "Biomedical" },
  { subject: "Pharmacy dispensing system running slow", category: "IT Support" },
  { subject: "Leaking pipe under sink in staff lounge", category: "Facilities" },
  { subject: "Request password reset for billing portal", category: "IT Support" },
  { subject: "Infusion pump alarm not silencing", category: "Biomedical" },
  { subject: "New starter needs system accounts provisioned", category: "IT Support" },
  { subject: "Signage missing for new consultation room", category: "Facilities" },
  { subject: "Report phishing email received by staff", category: "Security" },
]

export const TICKETS: SupportTicket[] = TICKET_SEEDS.map((seed, i) => {
  const requester = pick(STAFF)
  const status = pickWeighted<TicketStatus>([
    { value: "Open", weight: 3 },
    { value: "In Progress", weight: 3 },
    { value: "Resolved", weight: 2.5 },
    { value: "Closed", weight: 1.5 },
  ])
  const assignee = status === "Open" ? undefined : pick(ADMIN_STAFF.length > 0 ? ADMIN_STAFF : STAFF)

  return {
    id: id("TKT", i + 1),
    subject: seed.subject,
    category: seed.category,
    requesterId: requester.id,
    requesterName: requester.name,
    priority: pickWeighted<TicketPriority>([
      { value: "Low", weight: 3 },
      { value: "Medium", weight: 4 },
      { value: "High", weight: 2.2 },
      { value: "Urgent", weight: 0.8 },
    ]),
    status,
    assignedToId: assignee?.id,
    assignedToName: assignee?.name,
    createdAt: faker.date.recent({ days: 30 + i }).toISOString(),
  }
}).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

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
