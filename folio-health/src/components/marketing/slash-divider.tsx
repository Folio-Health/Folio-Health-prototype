/**
 * Diagonal-cut section seam — an alternative to WaveDivider for visual variety.
 * Same mechanism: the wrapper carries the PREVIOUS section's background, the
 * shape itself is filled with the NEXT section's background. The diagonal
 * edge is softened with a gaussian blur so it dissolves like a cloud rather
 * than cutting with a crisp vector line.
 */
function SlashDivider({
  prevBg,
  nextBg,
  flip = false,
}: {
  prevBg: string
  nextBg: string
  flip?: boolean
}) {
  return (
    <div className="relative w-full leading-none" style={{ backgroundColor: prevBg }} aria-hidden="true">
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="block h-10 w-full sm:h-16"
        style={{ transform: flip ? "scaleX(-1)" : undefined }}
      >
        <defs>
          <filter id="slash-cloud-fade" x="-10%" y="-50%" width="120%" height="220%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <path d="M0,90 L1440,0 L1440,130 L0,130 Z" fill={nextBg} filter="url(#slash-cloud-fade)" />
      </svg>
    </div>
  )
}

export { SlashDivider }
