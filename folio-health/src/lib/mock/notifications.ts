// Mock records removed: production shows real (empty) state. Types and vocabulary constants remain.
import type { AppNotification } from "@/types/core"

export const NOTIFICATIONS: AppNotification[] = []

export function getUnreadCount(): number {
  return NOTIFICATIONS.filter((n) => !n.read).length
}
