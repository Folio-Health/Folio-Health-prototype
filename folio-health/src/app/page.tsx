import { redirect } from "next/navigation"

/**
 * Folio Health is an internal system — there is no public landing page.
 * `proxy.ts` normally resolves "/" to /dashboard or /login before a request
 * reaches this component; this redirect is the fallback for any path that
 * bypasses the proxy matcher.
 */
export default function RootPage() {
  redirect("/login")
}
