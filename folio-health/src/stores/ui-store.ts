"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { RoleId } from "@/lib/auth/roles"

interface UiState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  aiAssistantOpen: boolean
  setAiAssistantOpen: (open: boolean) => void
  /**
   * "Preview as role" — a local, display-only override of which role's
   * dashboard/nav renders. `null` means show the signed-in user's own real
   * role (the default and the only thing that should ever be true in
   * production use). It never changes what the server will authorise; see
   * the usage note in profile-menu.tsx.
   */
  previewRole: Exclude<RoleId, "platform-admin"> | null
  setPreviewRole: (role: Exclude<RoleId, "platform-admin"> | null) => void
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
      previewRole: null,
      setPreviewRole: (role) => set({ previewRole: role }),
    }),
    { name: "folio-health-ui" }
  )
)
