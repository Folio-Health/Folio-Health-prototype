/**
 * Session cookie names.
 *
 * Deliberately free of any `server-only` import: the proxy (edge runtime),
 * server route handlers, and build-time code all need these constants.
 *
 * The cookies themselves hold real Medplum OAuth2 tokens, are httpOnly, and are
 * written only by `/api/auth/*`. Client code cannot read or forge them — which
 * is the whole point, since the previous `folio_session=1` cookie was set by
 * browser JavaScript and only ever checked for existence.
 */

export const ACCESS_TOKEN_COOKIE = "folio_at"
export const REFRESH_TOKEN_COOKIE = "folio_rt"

/**
 * Set at sign-in when the account still carries the first-login temporary
 * credential, and cleared once a permanent password is set.
 *
 * This is a ROUTING HINT, not the source of truth. The proxy needs to decide
 * "force the password page" without a network round-trip to Medplum on every
 * request, and it cannot read the Practitioner itself. The authoritative value
 * is the `temp-credential` extension, re-read from Medplum by `/api/auth/me`
 * and re-derived on every sign-in.
 *
 * Forging it buys nothing: clearing it early only skips a redirect, and every
 * route that matters still authorises against Medplum with the user's token.
 */
export const MUST_CHANGE_PASSWORD_COOKIE = "folio_pwchg"

/** Where a user is sent, and held, until they set a permanent password. */
export const SET_PASSWORD_PATH = "/set-password"
