"use client"

import { useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { SaveIcon, UploadCloudIcon, HospitalIcon, ImageIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
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
import { SettingsModuleTabs } from "./settings-module-tabs"
import { cn } from "@/lib/utils"

const PRIMARY_COLORS = [
  { label: "Blue", value: "#2563EB" },
  { label: "Emerald", value: "#059669" },
  { label: "Violet", value: "#7C3AED" },
  { label: "Rose", value: "#E11D48" },
  { label: "Amber", value: "#D97706" },
  { label: "Cyan", value: "#0891B2" },
]

const brandingSchema = z.object({
  name: z.string().min(1, "Hospital name is required"),
  tagline: z.string().max(140, "Keep the tagline under 140 characters").optional().or(z.literal("")),
})

type BrandingValues = z.infer<typeof brandingSchema>

function HospitalBrandingForm() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState(PRIMARY_COLORS[0].value)

  const form = useForm<BrandingValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      name: "Folio Health Medical Centre",
      tagline: "Compassionate care, advanced medicine.",
    },
  })

  function onSubmit(values: BrandingValues) {
    void values
    toast.success("Branding updated", {
      description: "Your logo, name, and color changes have been saved.",
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setLogoPreview(url)
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
              <CardTitle>Logo</CardTitle>
              <CardDescription>Shown in the sidebar, login screen, and printed documents.</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="Hospital logo preview" className="size-16 rounded-lg object-cover" />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <ImageIcon className="size-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-foreground">
                    <UploadCloudIcon className="mr-1.5 inline size-4 text-muted-foreground" />
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG or SVG, up to 2MB, transparent background recommended</p>
                </div>
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
              <CardDescription>How the hospital is identified across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hospital Name</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon>
                          <HospitalIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput placeholder="Folio Health Medical Centre" {...field} />
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A short tagline for the hospital" rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Primary Color</CardTitle>
              <CardDescription>Used for buttons, links, and highlights across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {PRIMARY_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setPrimaryColor(color.value)}
                    className="flex flex-col items-center gap-1.5"
                    aria-label={`Select ${color.label}`}
                  >
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-background transition-all",
                        primaryColor === color.value ? "ring-foreground" : "ring-transparent"
                      )}
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-xs text-muted-foreground">{color.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
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

export { HospitalBrandingForm }
