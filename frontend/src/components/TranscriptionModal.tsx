import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, Copy, TextQuote } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Segment } from "@/types/transcription"

interface TranscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  transcript: string
  fileName: string
  segments?: Segment[]
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export function TranscriptionModal({
  isOpen,
  onClose,
  transcript,
  fileName,
  segments = [],
}: TranscriptionModalProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle")

  useEffect(() => {
    if (copyState === "idle") {
      return
    }

    const timeout = window.setTimeout(() => {
      setCopyState("idle")
    }, 2000)

    return () => window.clearTimeout(timeout)
  }, [copyState])

  const transcriptWithTimestamps = useMemo(() => {
    if (segments.length === 0) {
      return transcript
    }

    return segments
      .map((segment) => `[${formatTimestamp(segment.start)} - ${formatTimestamp(segment.end)}] ${segment.text}`)
      .join("\n")
  }, [segments, transcript])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcriptWithTimestamps)
      setCopyState("copied")
    } catch (error) {
      console.error("Failed to copy transcript:", error)
      setCopyState("failed")
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <p className="section-label">Transcript detail</p>
          <DialogTitle className="flex items-center gap-3">
            <span>{fileName}</span>
          </DialogTitle>
          <DialogDescription>
            Review the full transcript, inspect timestamps, and copy the clean text back into your notes or docs.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="eyebrow-chip">
            <TextQuote className="mr-2 h-3.5 w-3.5" />
            {segments.length > 0 ? `${segments.length} timestamped segments` : "Plain transcript"}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  aria-label="Copy transcript"
                >
                  {copyState === "copied" ? <Check className="mr-2 h-4 w-4" /> : copyState === "failed" ? <AlertTriangle className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy transcript"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copyState === "copied" ? "Copied to clipboard" : copyState === "failed" ? "Could not access clipboard" : "Copy the full transcript"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <div className="rounded-[1.6rem] border border-border/80 bg-white/70 p-5">
            <h4 className="text-sm font-medium text-foreground">Transcript</h4>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground">
              {transcript || "No transcript text is available yet."}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-border/80 bg-white/70 p-5">
            <h4 className="text-sm font-medium text-foreground">Timeline</h4>
            <div className="mt-4 space-y-3">
              {segments.length > 0 ? (
                segments.map((segment, index) => (
                  <div
                    key={`${segment.start}-${segment.end}-${index}`}
                    className="rounded-2xl border border-border/70 bg-background/80 p-3"
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {formatTimestamp(segment.start)} - {formatTimestamp(segment.end)}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-foreground">{segment.text}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
                  Timestamped segments are only available when the transcription provider returns segment timing.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}