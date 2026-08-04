"use client"

import { SearchIcon } from "lucide-react"
import { Kbd } from "@/components/ui/kbd"
import { useUiStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

function GlobalSearch({ className }: { className?: string }) {
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen)

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className
      )}
    >
      <SearchIcon className="size-4 shrink-0" />
      <span className="flex-1 truncate text-left">Search patients, appointments...</span>
      <Kbd>Ctrl K</Kbd>
    </button>
  )
}

export { GlobalSearch }
