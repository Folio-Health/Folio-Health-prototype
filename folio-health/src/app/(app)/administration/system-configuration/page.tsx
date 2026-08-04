import type { Metadata } from "next"
import { SystemConfiguration } from "@/features/administration/components/system-configuration"

export const metadata: Metadata = { title: "System Configuration" }

export default function AdministrationSystemConfigurationPage() {
  return <SystemConfiguration />
}
