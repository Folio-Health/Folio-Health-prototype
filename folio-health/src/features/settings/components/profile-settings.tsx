"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import {
  SaveIcon,
  MailIcon,
  PhoneIcon,
  UserRoundIcon,
  ShieldIcon,
  ChevronDownIcon,
  Loader2Icon,
} from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { ListSkeleton } from "@/components/common/loading-skeletons"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { ROLE_LABELS } from "@/lib/auth/roles"
import { changePassword, useUpdateMyProfile } from "../hooks/use-my-profile"

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string(),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

const BREADCRUMBS = [
  { label: "System" },
  { label: "Settings", href: "/settings" },
  { label: "My Profile" },
]

/**
 * The signed-in user's own profile.
 *
 * Everything shown here comes from the authenticated session. The previous
 * version read a mock staff record chosen by the locally-selected role, so it
 * displayed a different person (name, job title, department, "Staff ID
 * EMP-00074", an "On Leave" badge and a bio) from the one the shell said was
 * signed in. None of those fields exist on the real identity, so they are gone
 * rather than invented.
 */
function ProfileSettings() {
  const { data: user, isLoading } = useCurrentUser()
  const isPractitioner = user?.resourceType === "Practitioner"
  const updateProfile = useUpdateMyProfile(user?.id ?? undefined)
  const [passwordOpen, setPasswordOpen] = useState(false)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "" },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  useEffect(() => {
    if (user) form.reset({ name: user.name, phone: "" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.name])

  if (isLoading) {
    return (
      <div>
        <PageHeader title="My Profile" breadcrumbs={BREADCRUMBS} />
        <ListSkeleton />
      </div>
    )
  }

  async function onSubmitProfile(values: ProfileValues) {
    try {
      await updateProfile.mutateAsync(values)
      toast.success("Profile updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your profile")
    }
  }

  async function onSubmitPassword(values: PasswordValues) {
    try {
      await changePassword(values.currentPassword, values.newPassword)
      passwordForm.reset()
      setPasswordOpen(false)
      toast.success("Password changed")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change your password")
    }
  }

  const roleLabel = user?.roles.length
    ? user.roles.map((r) => ROLE_LABELS[r]).join(" · ")
    : "Staff"

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Your account details and security"
        breadcrumbs={BREADCRUMBS}
      />

      <div className="flex max-w-2xl flex-col gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <PersonAvatar name={user?.name ?? ""} seed={user?.id ?? ""} size="lg" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="font-heading text-lg font-semibold text-foreground">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{roleLabel}</p>
              {(user?.email || user?.facilityName) && (
                <p className="truncate text-xs text-muted-foreground">
                  {[user?.email, user?.facilityName].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitProfile)}>
            <Card>
              <CardHeader>
                <CardTitle>Personal information</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupAddon>
                            <UserRoundIcon className="size-4" />
                          </InputGroupAddon>
                          <InputGroupInput disabled={!isPractitioner} {...field} />
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupAddon>
                            <PhoneIcon className="size-4" />
                          </InputGroupAddon>
                          <InputGroupInput disabled={!isPractitioner} {...field} />
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {user?.email && (
                  <div className="flex flex-col gap-1.5">
                    <FormLabel className="text-muted-foreground">Email</FormLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <MailIcon className="size-4" />
                      </InputGroupAddon>
                      <InputGroupInput value={user.email} readOnly disabled />
                    </InputGroup>
                    <p className="text-xs text-muted-foreground">
                      Your email is your sign-in identity and is changed by an administrator.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={!isPractitioner || updateProfile.isPending}>
                {updateProfile.isPending ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SaveIcon />
                )}
                Save changes
              </Button>
            </div>
          </form>
        </Form>

        {/* Collapsed by default — changing a password is rare, so it should not
            occupy half the page every visit. */}
        <Collapsible open={passwordOpen} onOpenChange={setPasswordOpen}>
          <Card>
            <CollapsibleTrigger
              render={
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
                />
              }
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">Change password</span>
                <span className="text-xs text-muted-foreground">
                  Use a strong password you don&apos;t use elsewhere
                </span>
              </span>
              <ChevronDownIcon
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  passwordOpen && "rotate-180"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Form {...passwordForm}>
                {/* method="post" is a pre-hydration safety net — see (auth)/login/page.tsx. */}
                <form method="post" onSubmit={passwordForm.handleSubmit(onSubmitPassword)}>
                  <CardContent className="flex flex-col gap-4 border-t border-border pt-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current password</FormLabel>
                          <FormControl>
                            <InputGroup>
                              <InputGroupAddon>
                                <ShieldIcon className="size-4" />
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New password</FormLabel>
                            <FormControl>
                              <InputGroup>
                                <InputGroupAddon>
                                  <ShieldIcon className="size-4" />
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
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm new password</FormLabel>
                            <FormControl>
                              <InputGroup>
                                <InputGroupAddon>
                                  <ShieldIcon className="size-4" />
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
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={passwordForm.formState.isSubmitting}
                      >
                        {passwordForm.formState.isSubmitting && (
                          <Loader2Icon className="size-4 animate-spin" />
                        )}
                        Update password
                      </Button>
                    </div>
                  </CardContent>
                </form>
              </Form>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  )
}

export { ProfileSettings }
