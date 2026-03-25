export type TranscriptionModel = "whisper" | "local-whisper"

export type TranscriptionStatus =
  | "pending"
  | "saving"
  | "processing"
  | "completed"
  | "error"

export interface Segment {
  text: string
  start: number
  end: number
}

export interface TranscriptionApiResponse {
  text: string
  segments: Segment[]
}

export interface SaveRecordingResponse {
  message: string
  file_path: string
  filename: string
  content_type: string
}

export interface WorkflowNotice {
  tone: "default" | "success" | "warning" | "destructive"
  title: string
  description: string
}

export interface TranscriptionResult {
  id: string
  file: File
  fileName: string
  fileSize: number
  transcript: string | null
  segments: Segment[]
  status: TranscriptionStatus
  errorMessage?: string
  savedFilePath?: string
  savedFilename?: string
}
