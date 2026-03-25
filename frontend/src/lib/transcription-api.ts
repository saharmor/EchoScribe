import type {
  SaveRecordingResponse,
  TranscriptionApiResponse,
  TranscriptionModel,
} from "@/types/transcription"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api"

function toUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: string }
    if (payload.detail) {
      return payload.detail
    }
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

export async function transcribeAudio(
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
    headers: {
      Accept: "application/json",
    },
  })

  const data = await parseJson<Partial<TranscriptionApiResponse>>(response)

  return {
    text: data.text ?? "",
    segments: data.segments ?? [],
  }
}
