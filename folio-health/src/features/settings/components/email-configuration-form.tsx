"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { SaveIcon, SendIcon, ServerIcon, UserRoundIcon, KeyIcon, MailIcon, HashIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { SettingsModuleTabs } from "./settings-module-tabs"

const emailConfigSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.string().min(1, "Port is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  fromAddress: z.string().min(1, "From address is required").email("Enter a valid email address"),
})

type EmailConfigValues = z.infer<typeof emailConfigSchema>

function EmailConfigurationForm() {
  const form = useForm<EmailConfigValues>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      smtpHost: "smtp.foliohealth.example",
      smtpPort: "587",
      username: "notifications@foliohealth.example",
      password: "••••••••••••",
      fromAddress: "noreply@foliohealth.example",
    },
  })

  function onSubmit(values: EmailConfigValues) {
    void values
    toast.success("Email configuration saved")
  }

  function sendTestEmail() {
    toast.success("Test email sent", { description: "Check the inbox for the configured account." })
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure branding, appearance, and system preferences"
        breadcrumbs={[{ label: "System" }, { label: "Settings" }]}
      />

      <SettingsModuleTabs />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>Used to send appointment reminders, receipts, and system emails.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
                <FormField
                  control={form.control}
                  name="smtpHost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Host</FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupAddon>
                            <ServerIcon className="size-4" />
                          </InputGroupAddon>
                          <InputGroupInput placeholder="smtp.example.com" {...field} />
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smtpPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupAddon>
                            <HashIcon className="size-4" />
                          </InputGroupAddon>
                          <InputGroupInput placeholder="587" {...field} />
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon>
                          <UserRoundIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput placeholder="notifications@hospital.example" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon>
                          <KeyIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput type="password" placeholder="••••••••" {...field} />
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fromAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Address</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon>
                          <MailIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput placeholder="noreply@hospital.example" {...field} />
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={sendTestEmail}>
              <SendIcon />
              Send Test Email
            </Button>
            <Button type="submit" size="lg">
              <SaveIcon />
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export { EmailConfigurationForm }
