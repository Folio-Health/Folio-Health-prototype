"use client"

import { PageHeader } from "@/components/common/page-header"
import { OrdersQueue } from "@/features/clinical/components/orders-queue"
import { LAB_CATEGORY } from "@/features/clinical/hooks/use-clinical"

/**
 * The laboratory's work queue.
 *
 * Imaging used to be a second tab here, because the imaging unit borrowed the
 * lab-scientist role when there was no separate radiographer. There is one now
 * (Implementation Manuscript §3, §4.5), so imaging lives at /radiology under
 * its own role. §3's rule is that no two roles see the same data, and a lab
 * scientist has no professional reason to hold the imaging queue.
 */
function LaboratoryHub() {
  return (
    <div>
      <PageHeader
        title="Laboratory"
        description="Orders placed by doctors — enter results to send them back to the visit"
        breadcrumbs={[{ label: "Diagnostics" }, { label: "Laboratory" }]}
      />
      <OrdersQueue category={LAB_CATEGORY} />
    </div>
  )
}

export { LaboratoryHub }
