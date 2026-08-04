import { cn } from "@/lib/utils"

/**
 * Folio Health mark: a single dog-eared "folio" page — the folded corner
 * reads as a document/chart at a glance — with a heartbeat trace run through
 * its middle, inside a rounded brand tile.
 */
function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Folio Health EMR"
    >
      <defs>
        <linearGradient id="folioTileGradient" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="39" height="39" rx="11.5" fill="url(#folioTileGradient)" />
      <rect x="0.5" y="0.5" width="39" height="39" rx="11.5" stroke="white" strokeOpacity="0.08" />

      {/* Page with a folded top-right corner */}
      <path
        d="M12 8H24L31 15V29A3 3 0 0 1 28 32H12A3 3 0 0 1 9 29V11A3 3 0 0 1 12 8Z"
        fill="white"
      />
      <path d="M24 8L31 15H25.5A1.5 1.5 0 0 1 24 13.5V8Z" fill="#BFDBFE" />

      {/* Heartbeat trace across the page */}
      <polyline
        points="12.5,23 16,23 18,16.5 21,27.5 23.5,19 25.5,23 27.5,23"
        fill="none"
        stroke="#2563EB"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Logo({
  className,
  markClassName,
  wordmarkClassName,
  size = 32,
  showWordmark = true,
  tone = "default",
}: {
  className?: string
  markClassName?: string
  wordmarkClassName?: string
  size?: number
  showWordmark?: boolean
  /** "default" for light surfaces, "inverted" for dark/brand-colored surfaces */
  tone?: "default" | "inverted"
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} className={cn("shrink-0", markClassName)} />
      {showWordmark && (
        <span
          className={cn(
            "flex items-baseline gap-1 font-heading leading-none tracking-tight",
            wordmarkClassName
          )}
          style={{ fontSize: size * 0.5625 }}
        >
          <span
            className={cn(
              "font-bold",
              tone === "inverted" ? "text-white" : "text-foreground"
            )}
          >
            Folio
          </span>
          <span
            className={cn(
              "font-medium",
              tone === "inverted" ? "text-white/70" : "text-primary"
            )}
          >
            Health
          </span>
          <span
            className={cn(
              "ml-0.5 self-start rounded-[4px] px-1 py-0.5 font-sans text-[0.36em] font-semibold tracking-wide uppercase",
              tone === "inverted" ? "bg-white/15 text-white/70" : "bg-muted text-muted-foreground"
            )}
          >
            EMR
          </span>
        </span>
      )}
    </div>
  )
}

export { Logo, LogoMark }
