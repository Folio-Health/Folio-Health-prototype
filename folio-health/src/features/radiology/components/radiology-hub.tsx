"use client"

import { PageHeader } from "@/components/common/page-header"
import { OrdersQueue } from "@/features/clinical/components/orders-queue"
import { IMAGING_CATEGORY } from "@/features/clinical/hooks/use-clinical"

/**
 * The imaging unit's queue: imaging orders placed by doctors, reported back
 * to the visit. Reporting is restricted to the performing role.
 */
function RadiologyHub() {
  return (
    <div>
      <PageHeader
        title="Radiology & Imaging"
        description="Imaging requests from doctors — file the report to send it back to the visit"
        breadcrumbs={[{ label: "Diagnostics" }, { label: "Radiology" }]}
      />
      <OrdersQueue category={IMAGING_CATEGORY} />
    </div>
  )
}

export { RadiologyHub }
