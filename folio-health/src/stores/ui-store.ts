"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ClinicalRole } from "@/types/core"

interface UiState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  aiAssistantOpen: boolean
  setAiAssistantOpen: (open: boolean) => void
  activeRole: ClinicalRole
  setActiveRole: (role: ClinicalRole) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      aiAssistantOpen: false,
      setAiAssistantOpen: (open) => set({ aiAssistantOpen: open }),
      activeRole: "Administrator",
      setActiveRole: (role) => set({ activeRole: role }),
    }),
    { name: "folio-health-ui" }
  )
)
