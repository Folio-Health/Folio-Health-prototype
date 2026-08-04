/**
 * Section seam: the wrapper carries the PREVIOUS section's background so it
 * continues seamlessly, while the wave shape itself is filled with the NEXT
 * section's background — so the next surface reads as rising up like water.
 * The seam itself is softened with a gaussian blur so it dissolves like a
 * cloud rather than cutting with a crisp vector edge.
 */
function WaveDivider({
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
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className="block h-12 w-full sm:h-20"
        style={{ transform: flip ? "rotate(180deg)" : undefined }}
      >
        <defs>
          <filter id="wave-cloud-fade" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <path
          d="M0,32 C220,88 420,0 700,28 C980,56 1200,8 1440,42 L1440,130 L0,130 Z"
          fill={nextBg}
          filter="url(#wave-cloud-fade)"
        />
      </svg>
    </div>
  )
}

export { WaveDivider }
