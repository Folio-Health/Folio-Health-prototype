/**
 * Build scope — which modules ship in the pilot (Implementation Manuscript §7).
 *
 * §7 is recorded as an OPEN TENSION, not a settled decision: the prototype grew
 * specialty dashboards before the core workflow was clear, and the manuscript's
 * own recommendation is to ship the six core interfaces (§4) first and treat
 * the specialty modules as an explicit Phase 2 add-on — for three reasons it
 * lists together: app weight on the unreliable connectivity common at target
 * Nigerian facilities, the offline-first principle, and the §6 onboarding goal
 * that a first-time user's starting point be completely unambiguous.
 *
 * So the code stays and the doors close. Flip SHIP_PHASE_2_MODULES to true and
 * every one of these modules returns to the sidebar and its routes reopen —
 * nothing was deleted, and nothing has to be rebuilt to change the answer.
 */

/** Modules deferred to Phase 2. Prefix-matched against the pathname. */
export const PHASE_2_MODULES = [
  "/emergency",
  "/surgery",
  "/pediatrics",
  "/obstetrics",
] as const

/** Set true to ship the specialty modules in the pilot build. */
export const SHIP_PHASE_2_MODULES = false

/** True when `href` belongs to a module deferred to Phase 2. */
export function isPhase2Module(href: string): boolean {
  return PHASE_2_MODULES.some((base) => href === base || href.startsWith(base + "/"))
}

/**
 * True when `href` is reachable in this build — i.e. it is not a deferred
 * module, or deferred modules are switched on.
 */
export function isModuleInScope(href: string): boolean {
  return SHIP_PHASE_2_MODULES || !isPhase2Module(href)
}
