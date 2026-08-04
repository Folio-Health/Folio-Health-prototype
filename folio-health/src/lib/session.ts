/**
 * Mock session only — this project has no real backend/auth. The cookie just
 * lets middleware.ts gate the staff app and patient portal behind the demo
 * login/signup forms instead of leaving every route open by URL.
 */
export const SESSION_COOKIE = "folio_session"

export function setSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
}

export function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`
}
