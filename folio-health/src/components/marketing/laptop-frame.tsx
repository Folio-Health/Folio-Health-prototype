import type { ReactNode } from "react"

/**
 * Realistic MacBook-style mockup: rounded display corners with a camera
 * notch cut into the screen itself (like modern MacBook Air/Pro), a thin
 * uniform bezel, and a tapered aluminum keyboard deck with a trackpad notch.
 * Built from plain CSS so the "screen" can hold real, live-rendered app
 * markup instead of a flat screenshot image.
 */
function LaptopFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl select-none">
      {/* Lid: aluminum chassis frame around the display */}
      <div className="rounded-t-2xl bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-400 p-1.5 pb-0 shadow-[0_40px_70px_-30px_rgb(0_0_0_/_0.55)] sm:rounded-t-[26px] sm:p-2 sm:pb-0">
        {/* Black bezel + rounded display */}
        <div className="rounded-t-[13px] bg-black p-[6px] sm:rounded-t-[20px] sm:p-2">
          <div className="relative overflow-hidden rounded-[8px] bg-background sm:rounded-xl">
            {/* Camera notch cut into the top of the screen, sized to sit within
                the chrome bar's own top padding so it never overlaps its content */}
            <div className="absolute inset-x-0 top-0 z-20 flex justify-center">
              <div className="relative h-2 w-14 rounded-b-md bg-black sm:h-2.5 sm:w-20">
                <span className="absolute top-1/2 left-1/2 size-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-700 sm:size-0.75" />
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>

      {/* Hinge seam */}
      <div className="relative h-[3px] bg-gradient-to-b from-neutral-400 to-neutral-500 sm:h-1">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20 blur-[1px] sm:h-1.5" />
      </div>

      {/* Base / keyboard deck — tapered aluminum body with a trackpad notch */}
      <div
        className="relative h-3.5 bg-gradient-to-b from-neutral-100 via-neutral-300 to-neutral-400 sm:h-5"
        style={{ clipPath: "polygon(1.2% 0%, 98.8% 0%, 100% 100%, 0% 100%)" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-white/70" />
        <span className="absolute top-0 left-1/2 h-[4px] w-16 -translate-x-1/2 rounded-b-full bg-neutral-400/90 sm:h-1.5 sm:w-24" />
      </div>

      {/* Grounding contact shadow */}
      <div className="mx-auto mt-3 h-3 w-[85%] rounded-[100%] bg-black/25 blur-lg sm:mt-4 sm:h-5" />
    </div>
  )
}

export { LaptopFrame }
