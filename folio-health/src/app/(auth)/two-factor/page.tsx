"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2Icon, ShieldCheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

const RESEND_SECONDS = 30

export default function TwoFactorPage() {
  const router = useRouter()
  const [otp, setOtp] = useState("")
  const [trustDevice, setTrustDevice] = useState(true)
  const [loading, setLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [secondsLeft])

  function handleVerify() {
    if (otp.length < 6) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success(
        trustDevice ? "Verified. This device is now trusted for 30 days" : "Verified successfully"
      )
      router.push("/dashboard")
    }, 900)
  }

  function handleResend() {
    setSecondsLeft(RESEND_SECONDS)
    toast.success("A new authentication code has been sent")
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheckIcon className="size-6 text-primary" />
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Two Factor Authentication
        </h1>
        <p className="text-sm text-muted-foreground">
          For your security, enter the 6 digit authentication code sent to your registered device.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>

        <div className="flex w-full items-center gap-2">
          <Checkbox
            id="trust-device"
            checked={trustDevice}
            onCheckedChange={(checked) => setTrustDevice(!!checked)}
          />
          <label htmlFor="trust-device" className="cursor-pointer text-sm text-muted-foreground">
            Trust this device for 30 days
          </label>
        </div>

        <Button
          size="lg"
          className="h-10.5 w-full"
          disabled={loading || otp.length < 6}
          onClick={handleVerify}
        >
          {loading && <Loader2Icon className="size-4 animate-spin" />}
          Verify &amp; Continue
        </Button>

        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive a code?{" "}
          {secondsLeft > 0 ? (
            <span className="text-muted-foreground/70">Resend in {secondsLeft}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="font-medium text-primary hover:underline"
            >
              Resend code
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
