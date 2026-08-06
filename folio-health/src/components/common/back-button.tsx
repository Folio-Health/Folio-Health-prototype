"use client"

import { useRouter } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

function BackButton({ fallbackHref = "/login" }: { fallbackHref?: string }) {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-muted-foreground"
      onClick={() => router.push(fallbackHref)}
    >
      <ArrowLeftIcon className="size-4" />
      Back
    </Button>
  )
}

export { BackButton }
