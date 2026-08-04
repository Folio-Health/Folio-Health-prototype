import type { ReactNode } from "react"
import Image from "next/image"
import { Logo } from "@/components/common/logo"
import { BackButton } from "@/components/common/back-button"
import { unsplash, MEDICAL_IMAGES } from "@/lib/images"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-between gap-10 px-6 py-8 sm:px-12 lg:px-16 lg:py-12">
        <div className="flex items-center justify-between">
          <Logo size={32} />
          <BackButton />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          {children}
        </div>
        <p className="text-center text-xs text-muted-foreground lg:text-left">
          &copy; {new Date().getFullYear()} Folio Health EMR. All rights reserved.
        </p>
      </div>
      <div className="relative hidden lg:block">
        <Image
          src={unsplash(MEDICAL_IMAGES.buildings[0], { w: 1600, q: 75 })}
          alt="Folio Health EMR hospital campus"
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-primary/10" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-transparent to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 flex flex-col gap-2 text-white">
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            Delivering Better Healthcare
          </h2>
          <p className="text-sm text-white/80">
            Integrated. Intelligent. Reliable. One system for every department, every
            role, every patient.
          </p>
        </div>
      </div>
    </div>
  )
}
