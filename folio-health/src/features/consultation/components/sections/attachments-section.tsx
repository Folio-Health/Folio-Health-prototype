"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { PaperclipIcon, UploadCloudIcon, XIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/common/empty-state"
import { RoleGate } from "@/components/common/role-gate"
import { cn } from "@/lib/utils"
import type { AttachmentItem } from "@/features/consultation/types"

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AttachmentsSection({
  attachments,
  onAdd,
  onRemove,
}: {
  attachments: AttachmentItem[]
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) onAdd(acceptedFiles)
    },
    [onAdd]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
        <CardDescription>Consent forms, referral letters, and scanned documents for this visit</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <RoleGate roles={["doctor", "nurse"]}>
          <div
            {...getRootProps()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center transition-colors",
              isDragActive && "border-primary bg-primary/5"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex size-11 items-center justify-center rounded-full bg-muted">
              <UploadCloudIcon className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {isDragActive ? "Drop files to attach" : "Drag & drop files here, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">PDFs, images, and documents up to 10MB</p>
          </div>
        </RoleGate>

        {attachments.length === 0 ? (
          <EmptyState icon={PaperclipIcon} title="No attachments yet" description="Files added for this visit will appear here." />
        ) : (
          <div className="flex flex-col gap-2">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <PaperclipIcon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => onRemove(file.id)}>
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

export { AttachmentsSection }
