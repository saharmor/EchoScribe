import { useCallback, useRef, useState } from "react"

import { saveRecording, transcribeAudio } from "@/lib/transcription-api"
import type { TranscriptionModel, Segment } from "@/types/transcription"

function recordingExtension(type: string) {
  if (type === "audio/ogg") return "ogg"
  if (type === "audio/wav") return "wav"
  return "webm"
}

function normaliseRecordingName(fileName: string) {
  return fileName
    .trim()
    .replace(/\.[^/.]+$/, "")
    .replace(/[<>:"/\\|?*]/g, "_")
}

export type WorkflowStatus = "idle" | "processing" | "completed" | "error"

export function useTranscriptionWorkflow() {
  const [selectedModel, setSelectedModel] = useState<TranscriptionModel>("whisper")
  const [prompt, setPrompt] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<WorkflowStatus>("idle")
  const [transcript, setTranscript] = useState<string | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const processingRef = useRef(false)

  const selectFile = useCallback((newFile: File) => {
    setFile(newFile)
    setStatus("idle")
    setTranscript(null)
    setSegments([])
    setErrorMessage(null)
  }, [])

  const startTranscription = useCallback(async () => {
    if (!file || processingRef.current) return

    processingRef.current = true
    setStatus("processing")
    setErrorMessage(null)

    try {
      const response = await transcribeAudio(file, selectedModel, prompt)
      setTranscript(response.text)
      setSegments(response.segments)
      setStatus("completed")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Transcription failed.")
      setStatus("error")
    } finally {
      processingRef.current = false
    }
  }, [file, selectedModel, prompt])

  const reset = useCallback(() => {
    setFile(null)
    setPrompt("")
    setStatus("idle")
    setTranscript(null)
    setSegments([])
    setErrorMessage(null)
  }, [])

  const handleRecordingComplete = useCallback(
    async (audioBlob: Blob, rawFileName: string) => {
      const normalisedName = normaliseRecordingName(rawFileName)
      const extension = recordingExtension(audioBlob.type)
      const recordedFile = new File([audioBlob], `${normalisedName}.${extension}`, {
        type: audioBlob.type || "audio/webm",
      })

      selectFile(recordedFile)

      try {
        await saveRecording(audioBlob, normalisedName)
      } catch {
        // Local save is best-effort; the file is still ready for transcription
      }
    },
    [selectFile],
  )

  return {
    selectedModel,
    setSelectedModel,
    prompt,
    setPrompt,
    file,
    status,
    transcript,
    segments,
    errorMessage,
    selectFile,
    startTranscription,
    reset,
    handleRecordingComplete,
    isTranscribing: status === "processing",
    canStart: file !== null && status !== "processing",
  }
}
