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
import { useUiStore } from "@/stores/ui-store"
import { useScopedNav } from "@/lib/auth/use-scoped-nav"
import { useCurrentUser } from "@/lib/fhir/use-current-user"
import { usePatients } from "@/features/patients/hooks/use-patients"

function CommandPalette() {
  const router = useRouter()
  const open = useUiStore((s) => s.commandPaletteOpen)
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const navSections = useScopedNav()
  const { data: user } = useCurrentUser()

  // The operator plane must not browse patients, so the group is not merely
  // hidden — the query never runs for them.
  const canSeePatients = user !== undefined && !user.platformOnly
  const { data: patientData } = usePatients({}, canSeePatients && open)
  const patients = canSeePatients ? (patientData?.patients ?? []).slice(0, 8) : []

  const navItems = (navSections ?? []).flatMap((section) => section.items)

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
          {navItems.map((item) => (
            <CommandItem key={item.href} onSelect={() => go(item.href)}>
              <item.icon />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>
        {patients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Patients">
              {patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={`${patient.name} ${patient.mrn}`}
                  onSelect={() => go(`/patients/${patient.id}`)}
                >
                  <UserRoundIcon />
                  {patient.name}
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    {patient.mrn}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

export { CommandPalette }
