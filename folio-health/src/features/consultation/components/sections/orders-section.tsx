"use client"

import { useState } from "react"
import { PlusIcon, XIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/common/status-badge"
import { EmptyState } from "@/components/common/empty-state"
import type { OrderItem, OrderPriority, OrderType } from "@/features/consultation/types"

function OrdersSection({
  orders,
  onAdd,
  onRemove,
}: {
  orders: OrderItem[]
  onAdd: (order: Omit<OrderItem, "id" | "createdAt">) => void
  onRemove: (id: string) => void
}) {
  const [type, setType] = useState<OrderType>("Lab")
  const [priority, setPriority] = useState<OrderPriority>("Routine")
  const [name, setName] = useState("")

  function handleAdd() {
    if (!name.trim()) return
    onAdd({ type, priority, name: name.trim() })
    setName("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>Lab and radiology orders placed during this visit</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType((v as OrderType) ?? "Lab")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lab">Lab</SelectItem>
                <SelectItem value="Radiology">Radiology</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority((v as OrderPriority) ?? "Routine")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Routine">Routine</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Test / Study Name</Label>
            <Input
              placeholder={type === "Lab" ? "e.g. Complete Blood Count" : "e.g. Chest X Ray"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAdd()
                }
              }}
            />
          </div>
          <Button type="button" onClick={handleAdd}>
            <PlusIcon />
            Add Order
          </Button>
        </div>

        {orders.length === 0 ? (
          <EmptyState title="No orders yet" description="Lab and radiology orders added this visit will appear here." />
        ) : (
          <div className="flex flex-col gap-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.type} tone={order.type === "Lab" ? "blue" : "violet"} />
                  <span className="text-sm font-medium text-foreground">{order.name}</span>
                  <StatusBadge status={order.priority} tone={order.priority === "Urgent" ? "red" : "slate"} />
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => onRemove(order.id)}>
                  <XIcon />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { OrdersSection }
