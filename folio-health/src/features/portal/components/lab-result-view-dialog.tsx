"use client"

import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/common/status-badge"
import { getStaffById } from "@/lib/mock/staff"
import type { LabResult } from "@/lib/mock/laboratory"

function LabResultViewDialog({
  result,
  open,
  onOpenChange,
}: {
  result: LabResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!result) return null

  const doctor = getStaffById(result.doctorId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{result.testName}</DialogTitle>
          <DialogDescription>
            Ordered {format(new Date(result.orderedAt), "MMM d, yyyy")} by {doctor?.name ?? "your doctor"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{result.testType}</span>
          <StatusBadge status={result.displayStatus} />
        </div>

        {result.parameters.length === 0 ? (
          <p className="text-sm text-muted-foreground">Results are still pending. Check back soon.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-9 px-3">Parameter</TableHead>
                  <TableHead className="h-9 px-3">Result</TableHead>
                  <TableHead className="h-9 px-3">Reference Range</TableHead>
                  <TableHead className="h-9 px-3">Flag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.parameters.map((p) => (
                  <TableRow key={p.parameter}>
                    <TableCell className="px-3 py-2">{p.parameter}</TableCell>
                    <TableCell className="px-3 py-2 tabular-nums">{p.result}</TableCell>
                    <TableCell className="px-3 py-2 tabular-nums text-muted-foreground">
                      {p.referenceRange}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      <StatusBadge status={p.flag} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {result.comments && (
          <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{result.comments}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { LabResultViewDialog }
