"use client"

import { PageHeader } from "@/components/common/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrdersQueue } from "@/features/clinical/components/orders-queue"
import { IMAGING_CATEGORY, LAB_CATEGORY } from "@/features/clinical/hooks/use-clinical"

/**
 * The laboratory's work queue. Imaging is a second tab here because the
 * imaging unit uses the lab-scientist role in V1 (there is no separate
 * radiographer role yet) and that role's navigation reaches this page.
 */
function LaboratoryHub() {
  return (
    <div>
      <PageHeader
        title="Laboratory"
        description="Orders placed by doctors — enter results to send them back to the visit"
        breadcrumbs={[{ label: "Diagnostics" }, { label: "Laboratory" }]}
      />
      <Tabs defaultValue="lab">
        <TabsList className="mb-3">
          <TabsTrigger value="lab">Laboratory</TabsTrigger>
          <TabsTrigger value="imaging">Imaging</TabsTrigger>
        </TabsList>
        <TabsContent value="lab">
          <OrdersQueue category={LAB_CATEGORY} />
        </TabsContent>
        <TabsContent value="imaging">
          <OrdersQueue category={IMAGING_CATEGORY} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { LaboratoryHub }
