"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CheckCircle2Icon, Loader2Icon, LockIcon, MailIcon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  // `useSearchParams` in a client page bails out of static prerendering; the
  // build requires a Suspense boundary above it. The fallback is null because
  // the form appears within a frame anyway — a skeleton would only flash.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [redirectTo, setRedirectTo] = useState("/dashboard")
  const searchParams = useSearchParams()

  // Derived during render rather than set from an effect: these only describe
  // the URL, and writing them into state on mount costs a second render pass
  // for a value that was already known.
  //
  // Set after a forced first-login password change. The session is gone by then
  // (Medplum revokes it on change), so this banner is the only way to tell the
  // user it worked instead of dropping them at a bare sign-in form.
  const passwordUpdated = searchParams.get("passwordUpdated") === "1"
  const flagWarning = passwordUpdated ? searchParams.get("warning") : null

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from")
    if (!from) return
    // A `startsWith("/")` check is not enough: "//evil.com" and "/\evil.com"
    // both pass it and resolve to a foreign origin, turning this into an open
    // redirect straight after a successful sign-in. Resolve and compare origins.
    try {
      const target = new URL(from, window.location.origin)
      if (target.origin === window.location.origin) {
        setRedirectTo(target.pathname + target.search)
      }
    } catch {
      // Malformed `from` — keep the default destination.
    }
  }, [])

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginValues) {
    setLoading(true)
    setFormError(null)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        setFormError(body.error ?? "Invalid email or password.")
        return
      }

      // Tokens are now set as httpOnly cookies by the route handler.
      // `refresh()` makes the server re-evaluate the proxy with them.
      router.replace(redirectTo)
      router.refresh()
    } catch {
      setFormError("Could not reach the Folio server. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Sign in
        </h1>
        <p className="text-sm text-muted-foreground">
          Use your Folio Health staff account to continue.
        </p>
      </div>

      {passwordUpdated && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm text-foreground"
        >
          <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>Your password is set. Sign in with your new password to continue.</span>
        </div>
      )}

      {flagWarning && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{flagWarning}</span>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupAddon>
                      <MailIcon className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      type="email"
                      autoComplete="username"
                      placeholder="you@foliohealth.example"
                      {...field}
                    />
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <InputGroup>
                    <InputGroupAddon>
                      <LockIcon className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" className="mt-1 h-10.5" disabled={loading}>
            {loading && <Loader2Icon className="size-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Folio Health accounts are provisioned by your facility administrator.
        <br />
        Having trouble signing in?{" "}
        <a
          href="mailto:it-support@foliohealth.example"
          className="font-medium text-primary hover:underline"
        >
          Contact IT support
        </a>
      </p>
    </div>
  )
}
