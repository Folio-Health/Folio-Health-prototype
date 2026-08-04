/**
 * Section seam shaped like the bottom arc of a large circle dipping down
 * into view — the PREVIOUS section's color is the dome (flat where it meets
 * the section above, curving down deepest at center), and the NEXT section's
 * color is the base it dips into. The dome's edge is softened with a
 * gaussian blur so it dissolves like a cloud rather than a crisp vector cut.
 */
function CircleDivider({
  prevBg,
  nextBg,
  flip = false,
}: {
  prevBg: string
  nextBg: string
  flip?: boolean
}) {
  return (
    <div className="relative w-full leading-none" aria-hidden="true">
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className="block h-16 w-full sm:h-24"
        style={{ transform: flip ? "scaleX(-1)" : undefined }}
      >
        <defs>
          <filter id="circle-cloud-fade" x="-10%" y="-50%" width="120%" height="220%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <rect width="1440" height="100" fill={nextBg} />
        <path
          d="M0,-30 L1440,-30 L1440,20 Q720,120 0,20 Z"
          fill={prevBg}
          filter="url(#circle-cloud-fade)"
        />
      </svg>
    </div>
  )
}

export { CircleDivider }
