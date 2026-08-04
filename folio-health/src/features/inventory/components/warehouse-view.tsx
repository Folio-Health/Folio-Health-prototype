"use client"

import { WarehouseIcon, SnowflakeIcon, BoxesIcon } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatCard } from "@/components/cards/stat-card"
import { Progress } from "@/components/ui/progress"
import { InventoryModuleTabs } from "./inventory-module-tabs"
import { WAREHOUSE_ZONES, SUPPLY_ITEMS } from "@/lib/mock/inventory"

function WarehouseView() {
  const totalItems = WAREHOUSE_ZONES.reduce((sum, z) => sum + z.itemCount, 0)
  const totalCapacity = WAREHOUSE_ZONES.reduce((sum, z) => sum + z.capacity, 0)
  const coldChainZones = WAREHOUSE_ZONES.filter((z) => z.temperatureControlled).length

  return (
    <div>
      <PageHeader
        title="Warehouse"
        description="Storage zones and stock distribution across facility locations"
        breadcrumbs={[{ label: "Facility" }, { label: "Inventory", href: "/inventory" }, { label: "Warehouse" }]}
      />

      <InventoryModuleTabs />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Storage Zones" value={WAREHOUSE_ZONES.length} icon={WarehouseIcon} />
        <StatCard label="Items Stored" value={totalItems} icon={BoxesIcon} />
        <StatCard
          label="Overall Utilization"
          value={`${Math.round((totalItems / totalCapacity) * 100)}%`}
          icon={BoxesIcon}
          tone="violet"
        />
        <StatCard label="Cold Chain Zones" value={coldChainZones} icon={SnowflakeIcon} tone="cyan" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {WAREHOUSE_ZONES.map((zone) => {
          const pct = Math.round((zone.itemCount / zone.capacity) * 100)
          return (
            <Card key={zone.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {zone.name}
                  {zone.temperatureControlled && (
                    <SnowflakeIcon className="size-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                  )}
                </CardTitle>
                <CardDescription>{zone.location}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items Stored</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {zone.itemCount.toLocaleString()} / {zone.capacity.toLocaleString()}
                  </span>
                </div>
                <Progress value={pct} />
                <span className="text-xs text-muted-foreground">{pct}% utilized</span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Tracking {SUPPLY_ITEMS.length} distinct SKUs across all storage locations.
      </p>
    </div>
  )
}

export { WarehouseView }
