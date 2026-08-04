"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Route } from "next"
import { UserRoundIcon } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { ALL_NAV_ITEMS } from "@/config/nav"
import { PATIENTS } from "@/lib/mock/patients"
import { useUiStore } from "@/stores/ui-store"

function CommandPalette() {
  const router = useRouter()
  const open = useUiStore((s) => s.commandPaletteOpen)
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!open)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, setOpen])

  function go(href: string) {
    setOpen(false)
    router.push(href as Route)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search modules, patients, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Modules">
          {ALL_NAV_ITEMS.map((item) => (
            <CommandItem key={item.href} onSelect={() => go(item.href)}>
              <item.icon />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Patients">
          {PATIENTS.slice(0, 8).map((patient) => (
            <CommandItem
              key={patient.id}
              value={`${patient.name} ${patient.mrn}`}
              onSelect={() => go(`/patients/${patient.id}`)}
            >
              <UserRoundIcon />
              {patient.name}
              <span className="ml-auto text-xs text-muted-foreground">{patient.mrn}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export { CommandPalette }
