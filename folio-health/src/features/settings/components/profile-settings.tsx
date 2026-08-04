"use client"

import { useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { SaveIcon, MailIcon, PhoneIcon, UserRoundIcon, ShieldIcon, CameraIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { PersonAvatar } from "@/components/common/person-avatar"
import { StatusBadge } from "@/components/common/status-badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUiStore } from "@/stores/ui-store"
import { getStaffByRole } from "@/lib/mock/staff"

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  bio: z.string().max(280, "Keep your bio under 280 characters").optional().or(z.literal("")),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

function initials(name: string) {
  return name
    .replace(/^Dr\.\s*/, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

function ProfileSettings() {
  const activeRole = useUiStore((s) => s.activeRole)
  const currentUser = getStaffByRole(activeRole)[0]
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
    toast.success("Profile photo updated")
  }

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser?.name ?? "",
      email: currentUser?.email ?? "",
      phone: currentUser?.phone ?? "",
      bio: currentUser?.bio ?? "",
    },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  useEffect(() => {
    form.reset({
      name: currentUser?.name ?? "",
      email: currentUser?.email ?? "",
      phone: currentUser?.phone ?? "",
      bio: currentUser?.bio ?? "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id])

  if (!currentUser) {
    return (
      <div>
        <PageHeader title="My Profile" breadcrumbs={[{ label: "System" }, { label: "Settings", href: "/settings" }, { label: "My Profile" }]} />
        <p className="text-sm text-muted-foreground">No active staff profile found.</p>
      </div>
    )
  }

  function onSubmitProfile(values: ProfileValues) {
    void values
    toast.success("Profile updated")
  }

  function onSubmitPassword(values: PasswordValues) {
    void values
    passwordForm.reset()
    toast.success("Password changed successfully")
  }

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Manage your personal information and account security"
        breadcrumbs={[{ label: "System" }, { label: "Settings", href: "/settings" }, { label: "My Profile" }]}
      />

      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            <div className="relative">
              {photoPreview ? (
                <Avatar size="lg" className="size-20">
                  <AvatarImage src={photoPreview} alt={currentUser.name} />
                  <AvatarFallback>{initials(currentUser.name)}</AvatarFallback>
                </Avatar>
              ) : (
                <PersonAvatar name={currentUser.name} size="lg" className="size-20" />
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background"
                aria-label="Change photo"
                onClick={() => photoInputRef.current?.click()}
              >
                <CameraIcon className="size-3.5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col items-center gap-1 sm:items-start">
              <p className="font-heading text-lg font-semibold text-foreground">{currentUser.name}</p>
              <p className="text-sm text-muted-foreground">
                {currentUser.title} &middot; {currentUser.department}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={currentUser.status} />
                <span className="text-xs text-muted-foreground">Staff ID: {currentUser.staffId}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitProfile)}>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>This information may be visible to other staff members.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupAddon>
                            <UserRoundIcon className="size-4" />
                          </InputGroupAddon>
                          <InputGroupInput {...field} />
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <InputGroup>
                            <InputGroupAddon>
                              <MailIcon className="size-4" />
                            </InputGroupAddon>
                            <InputGroupInput {...field} />
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
                            <InputGroupInput {...field} />
                          </InputGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A short bio visible on your staff profile" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <div className="mt-4 flex justify-end">
              <Button type="submit" size="lg">
                <SaveIcon />
                Save Changes
              </Button>
            </div>
          </form>
        </Form>

        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)}>
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Choose a strong password you don&apos;t use elsewhere.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupAddon>
                            <ShieldIcon className="size-4" />
                          </InputGroupAddon>
                          <InputGroupInput type="password" placeholder="••••••••" {...field} />
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
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <InputGroup>
                            <InputGroupAddon>
                              <ShieldIcon className="size-4" />
                            </InputGroupAddon>
                            <InputGroupInput type="password" placeholder="••••••••" {...field} />
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
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <InputGroup>
                            <InputGroupAddon>
                              <ShieldIcon className="size-4" />
                            </InputGroupAddon>
                            <InputGroupInput type="password" placeholder="••••••••" {...field} />
                          </InputGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            <div className="mt-4 flex justify-end">
              <Button type="submit" size="lg" variant="outline">
                <ShieldIcon />
                Update Password
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

export { ProfileSettings }
