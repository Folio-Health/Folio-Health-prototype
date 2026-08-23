// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
export interface AssistantMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface AssistantConversation {
  id: string
  title: string
  updatedAt: string
  messages: AssistantMessage[]
}

export interface SuggestedPrompt {
  label: string
  prompt: string
  category: "Clinical" | "Operations" | "Admin"
}

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    label: "Check drug dosage",
    prompt: "What is the recommended adult dosage for Amoxicillin?",
    category: "Clinical",
  },
  {
    label: "Sepsis red flags",
    prompt: "What are the early warning signs of sepsis I should watch for?",
    category: "Clinical",
  },
  {
    label: "Bed availability",
    prompt: "Check bed availability in the ICU",
    category: "Operations",
  },
  {
    label: "Draft discharge summary",
    prompt: "Draft a discharge summary template for a routine admission",
    category: "Operations",
  },
  {
    label: "Today's schedule",
    prompt: "Summarize today's appointment schedule",
    category: "Operations",
  },
  {
    label: "Insurance claim status",
    prompt: "How do I check the status of an insurance claim?",
    category: "Admin",
  },
]

/**
 * Lightweight keyword-matched responder standing in for a real model — this
 * project is frontend only, so every "AI" reply here is a canned, clearly
 * illustrative answer, not real clinical guidance.
 */
export function generateAssistantReply(message: string): string {
  const q = message.toLowerCase()

  if (q.includes("dosage") || q.includes("dose") || (q.includes("drug") && q.includes("interaction"))) {
    return (
      "Here's a general reference, always confirm against the current formulary and the patient's chart before prescribing:\n\n" +
      "• Amoxicillin (adult): 250–500mg every 8 hours, or 500–875mg every 12 hours depending on severity.\n" +
      "• Paracetamol (adult): 500–1000mg every 4–6 hours, max 4g/day.\n" +
      "• Always cross check renal and hepatic function before adjusting dosage for elderly or compromised patients.\n\n" +
      "Would you like me to pull up this patient's current medication list to check for interactions?"
    )
  }

  if (q.includes("sepsis")) {
    return (
      "Early warning signs of sepsis to flag for review:\n\n" +
      "• Fever above 38.3°C or temperature below 36°C\n" +
      "• Heart rate above 90 bpm\n" +
      "• Respiratory rate above 20 breaths per minute\n" +
      "• Confusion or altered mental status\n" +
      "• Low blood pressure or reduced urine output\n\n" +
      "If two or more of these are present alongside a suspected infection, escalate for a sepsis screening protocol immediately."
    )
  }

  if (q.includes("bed") || q.includes("icu") || q.includes("ward")) {
    return (
      "Head over to Admissions → Bed Allocation for the live, filterable view of bed availability by ward."
    )
  }

  if (q.includes("discharge")) {
    return (
      "Here's a discharge summary template you can adapt:\n\n" +
      "1. Admission diagnosis and reason for admission\n" +
      "2. Hospital course and treatment provided\n" +
      "3. Discharge diagnosis and condition at discharge\n" +
      "4. Medications on discharge, with dosage and duration\n" +
      "5. Follow up instructions and next appointment date\n" +
      "6. Red flag symptoms that should prompt the patient to return\n\n" +
      "You can start this directly from Admissions → Discharge for the patient in question."
    )
  }

  if (q.includes("schedule") || q.includes("appointment")) {
    return (
      "Open Appointments → Calendar View for today's full schedule breakdown by doctor and time slot."
    )
  }

  if (q.includes("claim") || q.includes("insurance") || q.includes("billing") || q.includes("invoice")) {
    return (
      "For insurance claims:\n\n" +
      "1. Go to Billing → Insurance Claims\n" +
      "2. Search by patient name or claim ID to see the current status: Submitted, Under Review, Approved, or Rejected\n" +
      "3. Rejected claims show a reason code you can act on directly\n\n" +
      "Want me to walk you through submitting a new claim instead?"
    )
  }

  if (q.includes("lab") || q.includes("result")) {
    return (
      "Lab results can be reviewed under Laboratory → Results, filterable by status: Pending, In Progress, Completed, or Approved.\n\n" +
      "Critical or abnormal values are automatically flagged in red and trigger a notification to the ordering physician. Let me know a patient or test name and I can point you to the right record."
    )
  }

  if (q.includes("hello") || q.includes("hi ") || q === "hi" || q.includes("hey")) {
    return "Hello! I'm the Folio Assistant, built into Folio Health EMR. I can help with clinical reference questions, hospital operations, and day to day tasks. What are you working on?"
  }

  if (q.includes("thank")) {
    return "Happy to help. Let me know if anything else comes up during your shift."
  }

  return (
    "I can help with clinical reference questions, checking bed or schedule availability, drafting notes and summaries, " +
    "and pointing you to the right module for a task. Could you tell me a bit more about what you're trying to do? " +
    "You can also try one of the suggested prompts to get started."
  )
}

export const INITIAL_CONVERSATIONS: AssistantConversation[] = []
