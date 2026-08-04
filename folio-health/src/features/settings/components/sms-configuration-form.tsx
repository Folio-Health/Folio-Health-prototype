"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { SaveIcon, SendIcon, KeyIcon, SignatureIcon } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SettingsModuleTabs } from "./settings-module-tabs"

const SMS_PROVIDERS = ["Termii", "Africa's Talking", "Twilio", "Infobip"] as const

const smsConfigSchema = z.object({
  provider: z.enum(SMS_PROVIDERS),
  apiKey: z.string().min(1, "API key is required"),
  senderId: z.string().min(1, "Sender ID is required").max(11, "Sender ID must be 11 characters or fewer"),
})

type SmsConfigValues = z.infer<typeof smsConfigSchema>

function SmsConfigurationForm() {
  const form = useForm<SmsConfigValues>({
    resolver: zodResolver(smsConfigSchema),
    defaultValues: {
      provider: "Termii",
      apiKey: "sk_live_••••••••••••••••",
      senderId: "FolioHlth",
    },
  })

  function onSubmit(values: SmsConfigValues) {
    void values
    toast.success("SMS configuration saved")
  }

  function sendTestSms() {
    toast.success("Test SMS sent", { description: "Check the registered test number for delivery." })
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
              <CardTitle>SMS Provider</CardTitle>
              <CardDescription>Used for appointment reminders and OTP verification codes.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select value={field.value} onValueChange={(v) => field.onChange(v ?? SMS_PROVIDERS[0])}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SMS_PROVIDERS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon>
                          <KeyIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput type="password" placeholder="Your provider API key" {...field} />
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender ID</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon>
                          <SignatureIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput placeholder="FolioHlth" {...field} />
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={sendTestSms}>
              <SendIcon />
              Send Test SMS
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

export { SmsConfigurationForm }
