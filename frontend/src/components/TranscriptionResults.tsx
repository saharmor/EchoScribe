import { useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TranscriptionResult } from "@/types/transcription"

import { TranscriptionModal } from "./TranscriptionModal"

interface TranscriptionResultsProps {
  results: TranscriptionResult[]
  isTranscribing: boolean
  onRemove: (id: string) => void
  onRetry: (id: string) => Promise<void> | void
}

function formatFileSize(bytes: number) {
  if (bytes === 0) {
    return "0 B"
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusMeta(status: TranscriptionResult["status"]) {
  switch (status) {
    case "completed":
      return {
        icon: CheckCircle2,
        label: "Completed",
        className: "border-success/20 bg-success/10 text-success",
      }
    case "processing":
      return {
        icon: Loader2,
        label: "Processing",
        className: "border-primary/20 bg-primary-soft text-primary",
      }
    case "saving":
      return {
        icon: Clock3,
        label: "Saving",
        className: "border-warning/20 bg-warning/10 text-warning-foreground",
      }
    case "error":
      return {
        icon: AlertCircle,
        label: "Error",
        className: "border-destructive/20 bg-destructive/10 text-destructive",
      }
    default:
      return {
        icon: Clock3,
        label: "Queued",
        className: "border-border bg-background text-muted-foreground",
      }
  }
}

function previewText(result: TranscriptionResult) {
  if (result.transcript) {
    return result.transcript.length > 280
      ? result.transcript.slice(0, 280) + "..."
      : result.transcript
  }

  if (result.status === "processing") {
    return "Transcribing..."
  }

  if (result.status === "saving") {
    return "Saving recording..."
  }

  if (result.status === "error") {
    return result.errorMessage || "Transcription failed."
  }

  return "Waiting to start."
}

export function TranscriptionResults({
  results,
  isTranscribing,
  onRemove,
  onRetry,
}: TranscriptionResultsProps) {
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null)

  const selectedResult = useMemo(
    () => results.find((r) => r.id === selectedResultId) ?? null,
    [results, selectedResultId],
  )

  return (
    <>
      <div className="space-y-3">
        {results.map((result) => {
          const meta = statusMeta(result.status)
          const StatusIcon = meta.icon

          return (
            <div
              key={result.id}
              className="rounded-2xl border border-border/80 bg-white/70 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-medium text-foreground">
                      {result.fileName}
                    </h3>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatFileSize(result.fileSize)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        meta.className,
                      )}
                    >
                      <StatusIcon
                        className={cn(
                          "h-3 w-3",
                          result.status === "processing" && "animate-spin",
                        )}
                      />
                      {meta.label}
                    </span>
                  </div>

                  <p className={cn(
                    "text-sm leading-6",
                    result.status === "error" ? "text-destructive" : "text-muted-foreground",
                  )}>
                    {previewText(result)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {result.status === "error" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Retry ${result.fileName}`}
                      onClick={() => onRetry(result.id)}
                      disabled={isTranscribing}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                  {result.transcript ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedResultId(result.id)}
                    >
                      View
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${result.fileName}`}
                    onClick={() => onRemove(result.id)}
                    disabled={isTranscribing && result.status === "processing"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedResult ? (
        <TranscriptionModal
          isOpen={Boolean(selectedResult)}
          onClose={() => setSelectedResultId(null)}
          transcript={selectedResult.transcript || ""}
          fileName={selectedResult.fileName}
          segments={selectedResult.segments}
        />
      ) : null}
    </>
  )
}
