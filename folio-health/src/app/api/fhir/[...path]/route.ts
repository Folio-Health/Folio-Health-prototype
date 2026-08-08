import { NextResponse, type NextRequest } from "next/server"
import { medplumUrl } from "@/lib/medplum/config"
import { getAccessToken, refreshSession } from "@/lib/medplum/session"

/**
 * Authenticated FHIR proxy.
 *
 * Client components call `/api/fhir/<resource>` on this app's own origin; this
 * route attaches the access token from the httpOnly cookie and forwards to
 * Medplum's `/fhir/R4/` endpoint. Three things fall out of that:
 *
 *  - No CORS. The browser only ever talks to this origin, so the Medplum
 *    server's allowlist doesn't need to know this app exists.
 *  - No tokens in browser JavaScript, so an XSS bug cannot exfiltrate a
 *    session.
 *  - Authorization stays with Medplum. This proxy deliberately does NOT decide
 *    who may read what — the user's AccessPolicy is enforced server-side by
 *    Medplum on every request. Do not add allow-listing logic here that would
 *    imply otherwise.
 */

/** Only the FHIR API is proxied — never Medplum's admin or auth endpoints. */
const FHIR_PREFIX = "fhir/R4"

/** Hop-by-hop and identity headers that must not be forwarded upstream. */
const STRIPPED_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "cookie",
  "authorization",
  "content-length",
  "accept-encoding",
])

async function forward(request: NextRequest, path: string[]): Promise<NextResponse> {
  let accessToken = await getAccessToken()
  if (!accessToken) {
    const refreshed = await refreshSession()
    if (refreshed.status === "unreachable") {
      // 503, never 401: the session may be perfectly valid and the server
      // merely unreachable. Answering 401 would make a network blip look like
      // a sign-out.
      return NextResponse.json(
        { error: "Can't reach Folio right now. Check your connection and try again." },
        { status: 503 }
      )
    }
    if (refreshed.status === "expired") {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }
    accessToken = refreshed.accessToken
  }

  const search = request.nextUrl.search
  const target = medplumUrl(`${FHIR_PREFIX}/${path.map(encodeURIComponent).join("/")}${search}`)

  const headers = new Headers()
  request.headers.forEach((value, key) => {
    if (!STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value)
  })

  // Buffer the body once so the request can be replayed after a token refresh.
  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  const body = hasBody ? await request.arrayBuffer() : undefined

  const send = (token: string) =>
    fetch(target, {
      method: request.method,
      headers: new Headers([...headers, ["Authorization", `Bearer ${token}`]]),
      body,
      cache: "no-store",
      redirect: "manual",
    })

  try {
    let response = await send(accessToken)

    // An expired access token looks like a 401; refresh once and replay.
    if (response.status === 401) {
      const refreshed = await refreshSession()
      if (refreshed.status === "unreachable") {
        return NextResponse.json(
          { error: "Can't reach Folio right now. Check your connection and try again." },
          { status: 503 }
        )
      }
      if (refreshed.status === "expired") {
        return NextResponse.json({ error: "Session expired." }, { status: 401 })
      }
      response = await send(refreshed.accessToken)
    }

    const responseHeaders = new Headers()
    for (const header of ["content-type", "etag", "last-modified", "location", "content-location"]) {
      const value = response.headers.get(header)
      if (value) responseHeaders.set(header, value)
    }
    // Patient data must never be cached by a shared cache or the browser.
    responseHeaders.set("Cache-Control", "no-store")

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    // Upstream unreachable mid-request — same reasoning as above, 503 not 401.
    console.error("[api/fhir] upstream request failed", error)
    return NextResponse.json(
      { error: "Can't reach Folio right now. Check your connection and try again." },
      { status: 503 }
    )
  }
}

type Params = { params: Promise<{ path: string[] }> }

export async function GET(request: NextRequest, { params }: Params) {
  return forward(request, (await params).path)
}
export async function POST(request: NextRequest, { params }: Params) {
  return forward(request, (await params).path)
}
export async function PUT(request: NextRequest, { params }: Params) {
  return forward(request, (await params).path)
}
export async function PATCH(request: NextRequest, { params }: Params) {
  return forward(request, (await params).path)
}
export async function DELETE(request: NextRequest, { params }: Params) {
  return forward(request, (await params).path)
}
