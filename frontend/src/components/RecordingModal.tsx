import { useEffect, useRef, useState } from "react"
import { Mic, StopCircle, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface RecordingModalProps {
  isOpen: boolean
  onClose: () => void
  onRecordingComplete: (audioBlob: Blob, fileName: string) => Promise<void> | void
}

export function RecordingModal({ isOpen, onClose, onRecordingComplete }: RecordingModalProps) {
  const [fileName, setFileName] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  useEffect(() => {
    if (!isOpen) {
      setFileName("")
      setIsRecording(false)
      setRecordingTime(0)
      setError(null)
      stopTimer()
      stopStream()
    }
  }, [isOpen])

  useEffect(() => () => {
    stopTimer()
    stopStream()
  }, [])

  const startRecording = async () => {
    if (!fileName.trim()) {
      setError("Please enter a file name.")
      return
    }

    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const preferredTypes = ["audio/webm", "audio/ogg", "audio/mp4", "audio/wav"]
      const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) ?? ""
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" })
        stopStream()

        try {
          await onRecordingComplete(audioBlob, fileName.trim())
        } catch (err) {
          console.error("Error processing recording:", err)
          setError("Something went wrong while saving the recording. Please try again.")
        } finally {
          onClose()
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      stopStream()
      setError("Could not access your microphone. Please check the browser permission and try again.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      stopTimer()
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleClose = () => {
    if (isRecording) {
      stopRecording()
      return
    }
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => {
      if (!open) {
        handleClose()
      }
    }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <p className="section-label">Capture</p>
          <DialogTitle>Record a fresh audio note</DialogTitle>
          <DialogDescription>
            Capture from your microphone, save the recording locally, and add it directly to the transcription queue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-2">
            <label htmlFor="fileName" className="text-sm font-medium text-foreground">
              Recording title
            </label>
            <input
              id="fileName"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Weekly product sync"
              className="w-full rounded-[1.35rem] border border-input bg-white/80 px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              disabled={isRecording}
            />
            <p className="text-sm leading-6 text-muted-foreground">
              We will save this recording inside `Documents/temp transcribe` using the original recording format.
            </p>
          </div>

          {error && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-foreground">
              {error}
            </div>
          )}

          <div className="rounded-[1.5rem] border border-border/80 bg-white/60 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Microphone status</p>
                <p className="text-sm text-muted-foreground">
                  {isRecording
                    ? "Recording is live. Stop when you're ready to review the transcript."
                    : "Recording starts immediately after you confirm microphone access."}
                </p>
              </div>
              <div className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground">
                {formatTime(recordingTime)}
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-sm text-foreground">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isRecording ? "animate-pulse bg-primary" : "bg-muted-foreground/35"
                }`}
              />
              {isRecording ? "Recording in progress" : "Ready to start"}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {!isRecording ? (
              <>
                <Button
                  onClick={startRecording}
                  className="flex-1"
                  disabled={!fileName.trim()}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Start Recording
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={stopRecording}
                className="w-full"
                variant="secondary"
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Stop Recording
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}