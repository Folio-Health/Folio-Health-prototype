"use client"

import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { MailCheckIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogoMark } from "@/components/common/logo"

const STORAGE_KEY = "folio_welcome_seen"

function WelcomeModal() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    const seen = window.localStorage.getItem(STORAGE_KEY)
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, "1")
    setOpen(false)
  }

  function handleSubscribe(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !email.includes("@")) {
      toast.error("Enter a valid email address")
      return
    }
    setSubscribed(true)
    toast.success("You're subscribed!")
    window.localStorage.setItem(STORAGE_KEY, "1")
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="sm:max-w-sm">
        {subscribed ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MailCheckIcon className="size-6" />
            </span>
            <div className="flex flex-col gap-1">
              <DialogTitle>You&apos;re on the list</DialogTitle>
              <DialogDescription>
                We&apos;ll send product news and updates to {email}.
              </DialogDescription>
            </div>
            <Button onClick={dismiss} className="mt-1 w-full">
              Continue exploring
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="items-center text-center sm:items-center sm:text-center">
              <LogoMark size={44} />
              <DialogTitle>Welcome to Folio Health EMR</DialogTitle>
              <DialogDescription>
                A connected hospital information system for every department and role. Want
                product news and updates in your inbox?
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="welcome-email" className="sr-only">
                  Email address
                </Label>
                <Input
                  id="welcome-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Subscribe
              </Button>
            </form>
            <DialogFooter className="sm:justify-center">
              <Button variant="ghost" size="sm" onClick={dismiss}>
                Maybe later
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { WelcomeModal }
