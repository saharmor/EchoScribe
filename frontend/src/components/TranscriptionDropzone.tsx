import { useCallback, useState } from "react"
import { ArrowUpFromLine, FileAudio, UploadCloud, X } from "lucide-react"
import { type FileRejection, useDropzone } from "react-dropzone"

import { cn } from "@/lib/utils"

interface TranscriptionDropzoneProps {
  onFileDrop: (file: File) => void
  currentFile: File | null
  onClear: () => void
  disabled?: boolean
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function TranscriptionDropzone({
  onFileDrop,
  currentFile,
  onClear,
  disabled = false,
}: TranscriptionDropzoneProps) {
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setRejectionMessage(null)
      if (acceptedFiles.length > 0) {
        onFileDrop(acceptedFiles[0])
      }
    },
    [onFileDrop],
  )

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const names = rejections.map((r) => r.file.name).join(", ")
    setRejectionMessage(
      `Unsupported file${rejections.length > 1 ? "s" : ""}: ${names}. Use MP3, WAV, M4A, OGG, or WEBM.`,
    )
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { "audio/*": [".mp3", ".m4a", ".wav", ".ogg", ".webm"] },
    disabled,
    multiple: false,
    maxFiles: 1,
  })

  if (currentFile) {
    return (
      <div className="flex h-full min-h-[5.5rem] items-center gap-3 rounded-2xl border border-border/80 bg-white/70 px-4 py-4 md:min-h-[8.5rem]">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background text-muted-foreground">
          <FileAudio className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{currentFile.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(currentFile.size)}</p>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-background hover:text-foreground"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "group h-full min-h-[8.5rem] rounded-2xl border border-dashed px-6 py-8 text-center transition duration-200",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
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
            {isDragActive ? (
              <ArrowUpFromLine className="h-5 w-5" />
            ) : (
              <UploadCloud className="h-5 w-5" />
            )}
          </div>
          <p className="text-sm font-medium text-foreground">
            {isDragActive ? "Drop to add" : "Drag an audio file here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground">MP3, WAV, M4A, OGG, WEBM</p>
        </div>
      </div>
      {rejectionMessage ? (
        <p className="mt-2 text-xs text-destructive">{rejectionMessage}</p>
      ) : null}
    </div>
  )
}
