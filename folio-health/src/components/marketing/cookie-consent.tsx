"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CookieIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "folio_cookie_consent"

function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(timer)
    }
  }, [])

  function decide(choice: "accepted" | "rejected") {
    window.localStorage.setItem(STORAGE_KEY, choice)
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
        >
          <div className="mx-auto flex max-w-3xl flex-col items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-2xl sm:flex-row sm:items-center">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CookieIcon className="size-4.5" />
            </span>
            <p className="flex-1 text-sm text-muted-foreground">
              We use cookies to keep you signed in and to understand how Folio Health EMR is used.
              No data leaves this demo environment.
            </p>
            <div className="flex w-full shrink-0 gap-2 sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => decide("rejected")}>
                Reject
              </Button>
              <Button className="flex-1 sm:flex-none" onClick={() => decide("accepted")}>
                Accept
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { CookieConsent }
