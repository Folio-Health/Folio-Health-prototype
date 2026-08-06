import type { ReactNode } from "react"

const KEY_ROWS = 4
const KEYS_PER_ROW = 13

/**
 * Realistic laptop mockup: a flat, fully legible screen (so live-rendered
 * app content stays readable) sitting above a base that's genuinely rotated
 * in 3D space — not just a flat trapezoid — so the keyboard deck reads as a
 * real angled surface, like a laptop photographed from slightly above.
 *
 * The base is given a fixed pre-rotation height so the foreshortening from
 * rotateX(60deg) — which halves its rendered height (cos(60°) = 0.5) — can be
 * compensated with an exact negative margin, keeping the hinge, base, and
 * contact shadow flush with no visual gap.
 */
function LaptopFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl select-none">
      {/* Lid: aluminum chassis frame around the display — kept flat/frontal
          so the screen content never distorts */}
      <div className="rounded-t-2xl bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-400 p-1.5 pb-0 shadow-[0_40px_70px_-30px_rgb(0_0_0_/_0.55)] sm:rounded-t-[26px] sm:p-2 sm:pb-0">
        {/* Black bezel + rounded display */}
        <div className="rounded-t-[13px] bg-black p-[6px] sm:rounded-t-[20px] sm:p-2">
          <div className="relative aspect-16/10 overflow-hidden rounded-[8px] bg-background sm:rounded-xl">
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

      {/* Base — genuinely tilted in 3D so its top surface (keyboard + trackpad)
          reads as an angled plane, like an open laptop viewed from above */}
      <div className="relative" style={{ perspective: "900px" }}>
        <div
          className="relative -mb-18.75 h-37.5 w-full origin-top overflow-hidden bg-linear-to-b from-neutral-200 via-neutral-300 to-neutral-400 sm:-mb-25 sm:h-50"
          style={{
            transform: "rotateX(60deg)",
            clipPath: "polygon(1.2% 0%, 98.8% 0%, 100% 100%, 0% 100%)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-white/70" />

          <div className="flex h-full flex-col items-center justify-center gap-4 px-[6%] sm:gap-6">
            {/* Keyboard well */}
            <div className="w-full rounded-[6px] bg-linear-to-b from-neutral-500 to-neutral-600 p-1.5 shadow-[inset_0_2px_4px_rgb(0_0_0/0.35)] sm:rounded-lg sm:p-2">
              <div className="flex flex-col gap-1 sm:gap-1.5">
                {Array.from({ length: KEY_ROWS }).map((_, row) => (
                  <div key={row} className="grid grid-cols-13 gap-0.5 sm:gap-1">
                    {Array.from({ length: KEYS_PER_ROW }).map((_, col) => (
                      <span
                        key={col}
                        className="h-1.5 rounded-[1px] bg-neutral-700/60 sm:h-2.5 sm:rounded-xs"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Trackpad */}
            <div className="h-6 w-[28%] rounded-md border border-neutral-500/50 bg-linear-to-b from-white/50 to-neutral-300/40 shadow-[inset_0_1px_2px_rgb(255_255_255/0.6)] sm:h-9" />
          </div>
        </div>
      </div>

      {/* Front lip — thin visible edge suggesting the chassis's real thickness */}
      <div className="mx-auto h-1.5 w-[92%] rounded-b-md bg-linear-to-b from-neutral-300 to-neutral-500 sm:h-2" />

      {/* Grounding contact shadow */}
      <div className="mx-auto mt-3 h-3 w-[85%] rounded-[100%] bg-black/25 blur-lg sm:mt-4 sm:h-5" />
    </div>
  )
}

export { LaptopFrame }
