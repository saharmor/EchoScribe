import { useCallback, useState } from "react"
import { ArrowUpFromLine, UploadCloud } from "lucide-react"
import { type FileRejection, useDropzone } from "react-dropzone"

import { cn } from "@/lib/utils"

interface TranscriptionDropzoneProps {
  onFilesDrop: (files: File[]) => void
  disabled?: boolean
}

export function TranscriptionDropzone({ onFilesDrop, disabled = false }: TranscriptionDropzoneProps) {
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setRejectionMessage(null)
    onFilesDrop(acceptedFiles)
  }, [onFilesDrop])

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const names = rejections.map((r) => r.file.name).join(", ")
    setRejectionMessage(`Unsupported file${rejections.length > 1 ? "s" : ""}: ${names}. Use MP3, WAV, M4A, OGG, or WEBM.`)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "audio/*": [".mp3", ".m4a", ".wav", ".ogg", ".webm"]
    },
    disabled,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "group rounded-2xl border border-dashed px-6 py-8 text-center transition duration-200",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer",
          isDragActive
            ? "border-primary/50 bg-primary-soft/80"
            : "border-border bg-white/70 hover:border-primary/30 hover:bg-white",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm transition",
              isDragActive
                ? "border-primary/30 bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground group-hover:text-foreground",
            )}
          >
            {isDragActive ? <ArrowUpFromLine className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
          </div>
          <p className="text-sm font-medium text-foreground">
            {isDragActive ? "Drop to add" : "Drag audio files here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground">
            MP3, WAV, M4A, OGG, WEBM
          </p>
        </div>
      </div>
      {rejectionMessage ? (
        <p className="mt-2 text-xs text-destructive">{rejectionMessage}</p>
      ) : null}
    </div>
  )
}