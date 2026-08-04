/**
 * The mock `Appointment` type has no real check-in timestamp field, so we
 * derive a stable, deterministic "checked in N minutes ago" from the
 * appointment id. This keeps the Waiting Room / Queue boards stable across
 * re-renders without adding a new field to the shared `Appointment` type
 * (which is owned by the foundation build, see AGENT_PATTERNS.md).
 */
function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

/** Minutes since this appointment's patient checked in (5–95 min). */
export function getWaitMinutes(appointmentId: string): number {
  return 5 + (hashString(appointmentId) % 91)
}

export function getCheckInTime(appointmentId: string): Date {
  return new Date(Date.now() - getWaitMinutes(appointmentId) * 60_000)
}
