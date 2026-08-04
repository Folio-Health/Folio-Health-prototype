import type { ReactNode } from "react"
import { PortalShell } from "@/components/layouts/portal-shell"

export default function PortalGroupLayout({ children }: { children: ReactNode }) {
  return <PortalShell>{children}</PortalShell>
}
