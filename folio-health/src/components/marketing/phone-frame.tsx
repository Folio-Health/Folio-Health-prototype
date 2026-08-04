import type { ReactNode } from "react"

/**
 * Minimal, realistic iPhone-style mockup (bezel, dynamic island, side
 * buttons, home indicator) built from plain CSS so the "screen" can hold
 * real app markup instead of a flat screenshot image.
 */
function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-[200px] shrink-0 select-none sm:w-[220px]">
      {/* Side buttons */}
      <span className="absolute top-20 -left-[3px] h-6 w-[3px] rounded-l-sm bg-neutral-700" />
      <span className="absolute top-32 -left-[3px] h-10 w-[3px] rounded-l-sm bg-neutral-700" />
      <span className="absolute top-28 -right-[3px] h-14 w-[3px] rounded-r-sm bg-neutral-700" />

      <div className="rounded-[2.4rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-[0_25px_50px_-15px_rgb(0_0_0_/_0.5)]">
        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.8rem] bg-background">
          <div className="absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-neutral-900" />
          {children}
          <div className="absolute bottom-1.5 left-1/2 z-10 h-1 w-24 -translate-x-1/2 rounded-full bg-foreground/25" />
        </div>
      </div>
    </div>
  )
}

export { PhoneFrame }
