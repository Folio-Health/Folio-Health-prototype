import { cn } from "@/lib/utils"
import FolioMarkLight from "../../../folio-brand/folio-mark.svg"
import FolioMarkDark from "../../../folio-brand/folio-mark-mono-white.svg"

/**
 * Folio mark: a letter "F" whose middle arm is a heartbeat (ECG) line,
 * ending in a coral "live signal" dot — from the official brand kit in
 * /folio-brand. Do not recolor, stretch, or approximate this by hand.
 */
function LogoMark({
  className,
  size = 32,
  tone = "default",
}: {
  className?: string
  size?: number
  tone?: "default" | "inverted"
}) {
  const src = tone === "inverted" ? FolioMarkDark : FolioMarkLight

  return (
    // eslint-disable-next-line @next/next/no-img-element -- brand SVG asset, not a photo
    <img src={src.src} alt="Folio" width={size} height={size} className={className} />
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
      <LogoMark size={size} className={cn("shrink-0", markClassName)} tone={tone} />
      {showWordmark && (
        <span
          className={cn(
            "font-sans leading-none font-medium tracking-tight",
            tone === "inverted" ? "text-white" : "text-foreground",
            wordmarkClassName
          )}
          style={{ fontSize: size * 0.5625 }}
        >
          Folio
        </span>
      )}
    </div>
  )
}

export { Logo, LogoMark }
