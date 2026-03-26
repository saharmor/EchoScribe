import type {
  SaveRecordingResponse,
  TranscriptionApiResponse,
  TranscriptionModel,
} from "@/types/transcription"
import { isWebMode, getStoredApiKey } from "@/lib/web-mode"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api"

function toUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: string; error?: { message?: string } }
    if (payload.detail) return payload.detail
    if (payload.error?.message) return payload.error.message
  } catch {
    // Fall back to the response status text below.
  }

  return response.statusText || "Something went wrong."
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as T
}

export async function saveRecording(
  audioBlob: Blob,
  fileName: string,
): Promise<SaveRecordingResponse> {
  if (isWebMode) {
    return {
      message: "Recording ready (web mode — not saved to disk)",
      file_path: "",
      filename: fileName,
      content_type: audioBlob.type,
    }
  }

  const extension =
    audioBlob.type === "audio/webm"
      ? "webm"
      : audioBlob.type === "audio/ogg"
        ? "ogg"
        : audioBlob.type === "audio/wav"
          ? "wav"
          : "webm"

  const formData = new FormData()
  formData.append("audio", audioBlob, `${fileName}.${extension}`)
  formData.append("filename", fileName)

  const response = await fetch(toUrl("/save-recording"), {
    method: "POST",
    body: formData,
  })

  return parseJson<SaveRecordingResponse>(response)
}

async function transcribeViaOpenAI(
  file: File,
  prompt: string,
): Promise<TranscriptionApiResponse> {
  const apiKey = getStoredApiKey()
  if (!apiKey) {
    throw new Error("Please enter your OpenAI API key above before transcribing.")
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("model", "whisper-1")

  if (prompt.trim()) {
    formData.append("prompt", prompt.trim())
  }

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const data = (await response.json()) as { text?: string }

  return {
    text: data.text ?? "",
    segments: [],
  }
}

async function transcribeViaBackend(
  file: File,
  model: TranscriptionModel,
  prompt: string,
): Promise<TranscriptionApiResponse> {
  const formData = new FormData()
  formData.append("audio", file)
  formData.append("model", model)

  if (prompt.trim()) {
    formData.append("prompt", prompt.trim())
  }

  const response = await fetch(toUrl("/transcribe"), {
    method: "POST",
    body: formData,
    headers: { Accept: "application/json" },
  })

  const data = await parseJson<Partial<TranscriptionApiResponse>>(response)

  return {
    text: data.text ?? "",
    segments: data.segments ?? [],
  }
}

export async function transcribeAudio(
  file: File,
  model: TranscriptionModel,
  prompt: string,
): Promise<TranscriptionApiResponse> {
  if (isWebMode) {
    return transcribeViaOpenAI(file, prompt)
  }

  return transcribeViaBackend(file, model, prompt)
}
