"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2Icon, LockIcon, ShieldCheckIcon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"

/**
 * Forced first-login password change.
 *
 * Reached only via the proxy redirect, which holds a temporary-credential
 * session here and nowhere else. There is deliberately no "skip" and no way
 * back into the app: the temporary password was handed over in person and is
 * known to whoever created the account, so it is not a credential the user may
 * keep working under.
 *
 * Signing out is the one alternative offered — being stuck on a page with no
 * exit at all is its own kind of broken.
 */

const MIN_PASSWORD_LENGTH = 8

const setPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter the temporary password you signed in with"),
    newPassword: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`),
    confirmPassword: z.string().min(1, "Re-enter your new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Both passwords must match",
    path: ["confirmPassword"],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    // Caught here as well as server-side so the user gets the answer without a
    // round-trip — and so a "success" can never mean the temporary password
    // survived as the permanent one.
    message: "Choose a password different from the temporary one",
    path: ["newPassword"],
  })

type SetPasswordValues = z.infer<typeof setPasswordSchema>

export default function SetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<SetPasswordValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  async function onSubmit(values: SetPasswordValues) {
    setLoading(true)
    setFormError(null)
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      })

      const body = await response.json().catch(() => ({}))

      if (!response.ok) {
        setFormError(body.error ?? "Could not set your password. Try again.")
        return
      }

      // Medplum revokes every session when the password changes, so there is no
      // authenticated state left to return to — the user signs in again with the
      // password they just chose.
      const params = new URLSearchParams({ passwordUpdated: "1" })
      if (body.flagCleared === false) {
        // Surfaced rather than hidden: if the flag survived, the next sign-in
        // will ask again, and the user deserves to know why before it happens.
        params.set("warning", body.warning ?? "")
      }
      router.replace(`/login?${params.toString()}`)
      router.refresh()
    } catch {
      setFormError("Could not reach the Folio server. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  async function onSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Signing out is best-effort; the redirect below still leaves the page.
    }
    router.replace("/login")
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Set your password
        </h1>
        <p className="text-sm text-muted-foreground">
          You signed in with a temporary password. Choose a permanent one to finish setting
          up your account.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm text-foreground">
        <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          Your temporary password is known to whoever created your account. Folio will not
          open until you replace it.
        </span>
      </div>

      <Form {...form}>
        {/* method="post" is a pre-hydration safety net — see login/page.tsx. */}
        <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temporary password</FormLabel>
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

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupAddon>
                      <LockIcon className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </InputGroup>
                </FormControl>
                <FormDescription>At least {MIN_PASSWORD_LENGTH} characters.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupAddon>
                      <LockIcon className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                      type="password"
                      autoComplete="new-password"
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
            Set password
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        You will sign in again with your new password.{" "}
        <button
          type="button"
          onClick={onSignOut}
          className="font-medium text-primary hover:underline"
        >
          Sign out instead
        </button>
      </p>
    </div>
  )
}
