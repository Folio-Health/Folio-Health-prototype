import { createHash, randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { TEMP_CREDENTIAL_EXTENSION_URL } from "@/lib/auth/roles"
import { demoTokenForUser, isDemoMode } from "@/lib/demo/mode"
import { demoSignIn } from "@/lib/demo/store"
import { medplumClientId, medplumUrl } from "@/lib/medplum/config"
import { storeTokens } from "@/lib/medplum/session"
import { ACCESS_TOKEN_COOKIE, MUST_CHANGE_PASSWORD_COOKIE } from "@/lib/session"

/**
 * Email + password sign-in against Medplum.
 *
 * Runs entirely server-side: the browser posts credentials here, and the
 * resulting OAuth2 tokens are stored in httpOnly cookies rather than being
 * handed to client JavaScript.
 *
 * Medplum's login is a three-step flow:
 *   1. POST /auth/login            → a login id, plus either an auth code or a
 *                                    list of memberships to choose between
 *   2. POST /auth/profile          → (only when the user belongs to more than
 *                                    one project) selects one, returns the code
 *   3. POST /oauth2/token          → exchanges the code for tokens (PKCE)
 */

function base64url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

interface LoginResponse {
  login?: string
  code?: string
  memberships?: { id: string; profile?: { reference?: string; display?: string } }[]
  /** Medplum returns an OperationOutcome on failure. */
  issue?: { details?: { text?: string } }[]
}

/**
 * Whether this account is still on its first-login temporary password.
 *
 * Read at sign-in so the proxy can gate every subsequent request from a cookie
 * instead of calling Medplum on each one. The Practitioner extension remains the
 * source of truth — this only decides where to send the user next.
 *
 * On any failure this returns `false`: a sign-in must not be blocked because the
 * flag could not be read. `/api/auth/me` re-reads it authoritatively, and the
 * client-side guard catches anyone who slips through.
 */
async function hasTemporaryCredential(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(medplumUrl("auth/me"), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    if (!response.ok) return false
    const me = await response.json()
    return Boolean(
      (me?.profile?.extension ?? []).some(
        (e: { url?: string; valueBoolean?: boolean }) =>
          e.url === TEMP_CREDENTIAL_EXTENSION_URL && e.valueBoolean === true
      )
    )
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  let email: string
  let password: string

  try {
    const body = await request.json()
    email = String(body.email ?? "")
    password = String(body.password ?? "")
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
  }

  // Demo mode: no Medplum. The password is not checked; the email resolves to
  // an account in the in-memory store — a seeded persona or anyone provisioned
  // through the app (see lib/demo/mode.ts). The demo token reuses the real
  // session cookie so the edge proxy's presence check works unchanged, and the
  // first-login flag is honoured exactly as in production.
  if (isDemoMode()) {
    const signIn = demoSignIn(email)
    if (signIn.status === "disabled") {
      return NextResponse.json(
        { error: "This account has been deactivated. Contact your administrator." },
        { status: 403 }
      )
    }
    const json = NextResponse.json({ ok: true, mustChangePassword: signIn.mustChangePassword })
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    }
    json.cookies.set(ACCESS_TOKEN_COOKIE, demoTokenForUser(signIn.practitionerId), cookieOptions)
    if (signIn.mustChangePassword) {
      json.cookies.set(MUST_CHANGE_PASSWORD_COOKIE, "1", cookieOptions)
    } else {
      json.cookies.delete(MUST_CHANGE_PASSWORD_COOKIE)
    }
    return json
  }

  const codeVerifier = base64url(randomBytes(32))
  const codeChallenge = base64url(createHash("sha256").update(codeVerifier).digest())

  try {
    // Step 1 — authenticate the credentials.
    const loginResponse = await fetch(medplumUrl("auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: medplumClientId(),
        email,
        password,
        scope: "openid offline_access",
        codeChallenge,
        codeChallengeMethod: "S256",
      }),
      cache: "no-store",
    })

    const login = (await loginResponse.json()) as LoginResponse

    if (!loginResponse.ok) {
      // Always generic. Medplum distinguishes "User not found" from a bad
      // password, which lets an unauthenticated caller enumerate valid staff
      // accounts; collapse both into one message and one status code.
      console.warn("[auth/login] rejected:", login.issue?.[0]?.details?.text ?? loginResponse.status)
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
    }

    // Step 2 — resolve a project membership if the user has more than one.
    let code = login.code
    if (!code && login.login && login.memberships?.length) {
      const profileResponse = await fetch(medplumUrl("auth/profile"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: login.login, profile: login.memberships[0].id }),
        cache: "no-store",
      })
      const profile = (await profileResponse.json()) as LoginResponse
      if (!profileResponse.ok || !profile.code) {
        return NextResponse.json({ error: "Could not select a project profile." }, { status: 400 })
      }
      code = profile.code
    }

    if (!code) {
      return NextResponse.json({ error: "Sign-in did not return an authorization code." }, { status: 400 })
    }

    // Step 3 — exchange the code for tokens.
    const tokenResponse = await fetch(medplumUrl("oauth2/token"), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: medplumClientId(),
        code,
        code_verifier: codeVerifier,
      }),
      cache: "no-store",
    })

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: "Could not complete sign-in." }, { status: 400 })
    }

    const tokens = await tokenResponse.json()
    await storeTokens(tokens)

    // Decide once, here, where this session is allowed to go.
    const mustChangePassword = await hasTemporaryCredential(tokens.access_token)

    const json = NextResponse.json({ ok: true, mustChangePassword })
    if (mustChangePassword) {
      json.cookies.set(MUST_CHANGE_PASSWORD_COOKIE, "1", {
        // Readable by the proxy only; the client learns this from the JSON body
        // and from /api/auth/me, so it never needs to read the cookie itself.
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      })
    } else {
      // A previous forced-change session may have left this behind.
      json.cookies.delete(MUST_CHANGE_PASSWORD_COOKIE)
    }
    return json
  } catch (error) {
    console.error("[auth/login] Medplum request failed", error)
    return NextResponse.json(
      { error: "Could not reach the Folio server. Check your connection and try again." },
      { status: 502 }
    )
  }
}
