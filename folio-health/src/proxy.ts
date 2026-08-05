import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE } from "@/lib/session"

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/otp-verification",
  "/two-factor",
  "/session-expired",
  "/capabilities",
  "/faqs",
  "/support",
]

const AUTH_FORM_PATHS = ["/login", "/signup"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = request.cookies.has(SESSION_COOKIE)
  const isPublic = PUBLIC_PATHS.includes(pathname)

  if (!isAuthenticated && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthenticated && AUTH_FORM_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|webp|ico|webmanifest|json|xml|txt)$).*)"],
}
