import type { ReactNode } from "react"

/**
 * Realistic laptop mockup (thin-bezel lid + tapered aluminum base with a
 * trackpad notch) built from plain CSS so the "screen" can hold real,
 * live-rendered app markup instead of a flat screenshot image.
 */
function LaptopFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl select-none">
      {/* Lid: thin metallic chassis around a near-black screen bezel */}
      <div className="rounded-t-[14px] bg-gradient-to-b from-neutral-300 via-neutral-400 to-neutral-500 p-[3px] shadow-[0_35px_60px_-25px_rgb(0_0_0_/_0.5)] sm:rounded-t-[20px] sm:p-1">
        <div className="rounded-t-[12px] border-[8px] border-b-[16px] border-neutral-950 bg-neutral-950 sm:rounded-t-[17px] sm:border-[11px] sm:border-b-[20px]">
          {/* Webcam housing */}
          <div className="flex items-center justify-center gap-1.5 py-[3px] sm:py-1">
            <span className="size-[3px] rounded-full bg-neutral-700 sm:size-1" />
          </div>
          <div className="overflow-hidden rounded-[2px] bg-background">{children}</div>
        </div>
      </div>

      {/* Hinge shadow — a dark seam where the lid meets the base */}
      <div className="relative h-[3px] bg-neutral-600 sm:h-1">
        <div className="absolute inset-x-0 top-0 h-px bg-black/30" />
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-b from-black/25 to-transparent sm:h-2" />
      </div>

      {/* Base / keyboard deck — tapered aluminum body with a trackpad notch */}
      <div
        className="relative h-3 bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-400 sm:h-4"
        style={{ clipPath: "polygon(1.5% 0%, 98.5% 0%, 100% 100%, 0% 100%)" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-white/60" />
        <span className="absolute top-0 left-1/2 h-[3px] w-14 -translate-x-1/2 rounded-b-full bg-neutral-400/80 shadow-[0_1px_1px_rgb(0_0_0_/_0.15)] sm:h-1 sm:w-20" />
      </div>

      {/* Grounding contact shadow */}
      <div className="mx-auto mt-2 h-3 w-[92%] rounded-[100%] bg-black/20 blur-md sm:mt-3 sm:h-4" />
    </div>
  )
}

export { LaptopFrame }
