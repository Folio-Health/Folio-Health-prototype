"use client"

import { useRouter } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter()

  function goBack() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={goBack}>
      <ArrowLeftIcon className="size-4" />
      Back
    </Button>
  )
}

export { BackButton }
