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
