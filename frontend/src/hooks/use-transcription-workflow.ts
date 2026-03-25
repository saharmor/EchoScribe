import { useCallback, useMemo, useRef, useState } from "react"

import { saveRecording, transcribeAudio } from "@/lib/transcription-api"
import type {
  TranscriptionModel,
  TranscriptionResult,
  WorkflowNotice,
} from "@/types/transcription"

function buildId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function buildQueueItem(file: File): TranscriptionResult {
  return {
    id: buildId(),
    file,
    fileName: file.name,
    fileSize: file.size,
    transcript: null,
    segments: [],
    status: "pending",
  }
}

function recordingExtension(type: string) {
  if (type === "audio/ogg") {
    return "ogg"
  }

  if (type === "audio/wav") {
    return "wav"
  }

  return "webm"
}

function normaliseRecordingName(fileName: string) {
  return fileName
    .trim()
    .replace(/\.[^/.]+$/, "")
    .replace(/[<>:"/\\|?*]/g, "_")
}

export function useTranscriptionWorkflow() {
  const [selectedModel, setSelectedModel] = useState<TranscriptionModel>("whisper")
  const [prompt, setPrompt] = useState("")
  const [results, setResults] = useState<TranscriptionResult[]>([])
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [notice, setNotice] = useState<WorkflowNotice | null>(null)
  const processingLockRef = useRef(false)

  const updateResult = useCallback(
    (id: string, updater: (result: TranscriptionResult) => TranscriptionResult) => {
      setResults((current) =>
        current.map((result) => (result.id === id ? updater(result) : result)),
      )
    },
    [],
  )

  const enqueueFiles = useCallback((files: File[]) => {
    if (files.length === 0) {
      return
    }

    setResults((current) => [...files.map(buildQueueItem), ...current])
    setNotice({
      tone: "default",
      title: `${files.length} file${files.length === 1 ? "" : "s"} ready`,
      description: "You can review the queue, adjust the prompt, and start transcribing when ready.",
    })
  }, [])

  const removeResult = useCallback((id: string) => {
    setResults((current) => current.filter((result) => result.id !== id))
  }, [])

  const resetWorkflow = useCallback(() => {
    setPrompt("")
    setResults([])
    setNotice(null)
    setIsTranscribing(false)
  }, [])

  const dismissNotice = useCallback(() => {
    setNotice(null)
  }, [])

  const processEntries = useCallback(
    async (entries: TranscriptionResult[]) => {
      if (entries.length === 0 || processingLockRef.current) {
        return
      }

      processingLockRef.current = true
      setIsTranscribing(true)
      setNotice(null)

      let completed = 0
      let failed = 0

      try {
        for (const entry of entries) {
          updateResult(entry.id, (current) => ({
            ...current,
            status: "processing",
            errorMessage: undefined,
          }))

          try {
            const response = await transcribeAudio(entry.file, selectedModel, prompt)

            updateResult(entry.id, (current) => ({
              ...current,
              transcript: response.text,
              segments: response.segments,
              status: "completed",
              errorMessage: undefined,
            }))

            completed += 1
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "We could not transcribe that file."

            updateResult(entry.id, (current) => ({
              ...current,
              status: "error",
              errorMessage: message,
            }))

            failed += 1
          }
        }
      } finally {
        processingLockRef.current = false
        setIsTranscribing(false)
      }

      if (failed === 0) {
        setNotice({
          tone: "success",
          title: "Transcription complete",
          description: `Finished ${completed} file${completed === 1 ? "" : "s"} successfully.`,
        })
        return
      }

      if (completed > 0) {
        setNotice({
          tone: "warning",
          title: "Transcription finished with a few issues",
          description: `${completed} completed, ${failed} failed. You can retry the failed files individually.`,
        })
        return
      }

      setNotice({
        tone: "destructive",
        title: "Transcription failed",
        description: "None of the queued files completed. Review the error details and try again.",
      })
    },
    [prompt, selectedModel, updateResult],
  )

  const startTranscription = useCallback(async () => {
    const entries = results.filter((result) =>
      result.status === "pending" || result.status === "error"
        ? Boolean(result.file)
        : false,
    )

    await processEntries(entries)
  }, [processEntries, results])

  const retryResult = useCallback(
    async (id: string) => {
      const entry = results.find((result) => result.id === id)

      if (!entry) {
        return
      }

      await processEntries([entry])
    },
    [processEntries, results],
  )

  const handleRecordingComplete = useCallback(
    async (audioBlob: Blob, fileName: string) => {
      const normalisedName = normaliseRecordingName(fileName)
      const extension = recordingExtension(audioBlob.type)
      const recordedFile = new File([audioBlob], `${normalisedName}.${extension}`, {
        type: audioBlob.type || "audio/webm",
      })
      const queueItem = {
        ...buildQueueItem(recordedFile),
        status: "saving" as const,
      }

      setResults((current) => [queueItem, ...current])

      try {
        const savedRecording = await saveRecording(audioBlob, normalisedName)

        updateResult(queueItem.id, (current) => ({
          ...current,
          status: "pending",
          savedFilePath: savedRecording.file_path,
          savedFilename: savedRecording.filename,
        }))

        setNotice({
          tone: "success",
          title: "Recording saved locally",
          description: `Saved ${savedRecording.filename} to Documents/temp transcribe and added it to the queue.`,
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "We could not save the local recording."

        updateResult(queueItem.id, (current) => ({
          ...current,
          status: "pending",
          errorMessage: undefined,
        }))

        setNotice({
          tone: "warning",
          title: "Recording added, but not saved locally",
          description: `${message} You can still transcribe the recording from the queue.`,
        })
      }
    },
    [updateResult],
  )

  const summary = useMemo(() => {
    const counts = results.reduce(
      (accumulator, result) => {
        accumulator.total += 1
        accumulator[result.status] += 1
        return accumulator
      },
      {
        total: 0,
        pending: 0,
        saving: 0,
        processing: 0,
        completed: 0,
        error: 0,
      },
    )

    return {
      ...counts,
      readyToRun: counts.pending + counts.error,
      hasResults: counts.total > 0,
      canStart: counts.pending + counts.error > 0 && !isTranscribing,
    }
  }, [isTranscribing, results])

  return {
    dismissNotice,
    enqueueFiles,
    handleRecordingComplete,
    isTranscribing,
    notice,
    prompt,
    removeResult,
    resetWorkflow,
    results,
    retryResult,
    selectedModel,
    setPrompt,
    setSelectedModel,
    startTranscription,
    summary,
  }
}
