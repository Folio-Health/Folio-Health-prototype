"use client"

import { useEffect, useState } from "react"

/**
 * Delays propagating a rapidly-changing value.
 *
 * Used for search inputs so that typing issues one FHIR query when the user
 * pauses, rather than one per keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
