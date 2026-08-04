import Link from "next/link"
import { ClockAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SessionExpiredPage() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-amber-500/10">
        <ClockAlertIcon className="size-7 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Your session has expired
        </h1>
        <p className="text-sm text-muted-foreground">
          For your security, you&apos;ve been signed out after a period of inactivity. Please sign in again to
          continue.
        </p>
      </div>
      <Button size="lg" className="h-10.5 w-full" render={<Link href="/login" />}>
        Return to Login
      </Button>
    </div>
  )
}
