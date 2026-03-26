import { useState } from "react"
import { Mic, RotateCcw, Sparkles, Waves } from "lucide-react"

import { RecordingModal } from "@/components/RecordingModal"
import { TranscriptionDropzone } from "@/components/TranscriptionDropzone"
import { TranscriptionResults } from "@/components/TranscriptionResults"
import { ApiKeyInput } from "@/components/ApiKeyInput"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isWebMode } from "@/lib/web-mode"
import { useTranscriptionWorkflow } from "@/hooks/use-transcription-workflow"
import type { TranscriptionModel } from "@/types/transcription"

const allModelOptions: Array<{
  value: TranscriptionModel
  title: string
  description: string
  icon: typeof Sparkles
  webOnly?: boolean
}> = [
  {
    value: "whisper",
    title: "OpenAI Whisper",
    description: "Cloud-based, fast and high quality.",
    icon: Sparkles,
  },
  {
    value: "local-whisper",
    title: "Local Whisper",
    description: "Runs on your machine, fully offline.",
    icon: Waves,
  },
]

const modelOptions = isWebMode
  ? allModelOptions.filter((o) => o.value !== "local-whisper")
  : allModelOptions

export default function Home() {
  const [showRecordingModal, setShowRecordingModal] = useState(false)
  const {
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
  } = useTranscriptionWorkflow()

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
            EchoScribe
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">
            {isWebMode
              ? "Transcribe recordings using OpenAI Whisper. Drop your files, enter your API key, and get clean transcripts in seconds."
              : "Transcribe recordings and generate insights locally or via the cloud. Pick a model, drop your files, and get clean transcripts in seconds."}
          </p>
        </div>

        {isWebMode && <ApiKeyInput />}

        {/* Notice banner */}
        {notice ? (
          <div className="mb-6">
            <Alert tone={notice.tone}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <AlertTitle>{notice.title}</AlertTitle>
                  <AlertDescription>{notice.description}</AlertDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={dismissNotice}>
                  Dismiss
                </Button>
              </div>
            </Alert>
          </div>
        ) : null}

        {/* Main workspace card */}
        <div className="surface-panel p-6 sm:p-8">
          <div className="space-y-6">
            {/* Model picker — hidden in web mode since only cloud Whisper is available */}
            {modelOptions.length > 1 && (
            <div>
              <label className="section-label mb-3 block">Transcription model</label>
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Transcription model">
                {modelOptions.map(({ value, title, description, icon: Icon }) => {
                  const active = selectedModel === value
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={isTranscribing}
                      onClick={() => setSelectedModel(value)}
                      className={cn(
                        "flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition duration-150",
                        isTranscribing && "pointer-events-none opacity-60",
                        active
                          ? "border-primary/40 bg-primary-soft/80 shadow-sm"
                          : "border-border/80 bg-white/70 hover:border-foreground/15 hover:bg-white",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                          active
                            ? "border-primary/30 bg-primary text-primary-foreground"
                            : "border-border/80 bg-background text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-foreground">{title}</span>
                        <span className="block text-sm leading-5 text-muted-foreground">
                          {description}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            )}

            {/* Prompt */}
            <div>
              <label
                htmlFor="transcription-prompt"
                className="section-label mb-2 block"
              >
                Prompt guidance (optional)
              </label>
              <textarea
                id="transcription-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isTranscribing}
                placeholder="E.g. Product review with Sahar and Maya. Preserve names and action items."
                className={cn(
                  "w-full rounded-2xl border border-input bg-white/80 px-4 py-3 text-sm leading-6 text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/20",
                  isTranscribing && "opacity-60",
                )}
                rows={2}
              />
            </div>

            {/* Divider with input options */}
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Add audio
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            {/* Record + Dropzone side by side on larger screens */}
            <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 rounded-2xl px-6 py-6 sm:px-8"
                onClick={() => setShowRecordingModal(true)}
                disabled={isTranscribing}
              >
                <Mic className="h-6 w-6" />
                <span className="text-sm font-medium">Record</span>
              </Button>
              <TranscriptionDropzone onFilesDrop={enqueueFiles} disabled={isTranscribing} />
            </div>

            {/* Action row */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1"
                onClick={startTranscription}
                disabled={!summary.canStart}
              >
                {isTranscribing
                  ? "Transcribing..."
                  : summary.readyToRun > 0
                    ? `Start transcribing (${summary.readyToRun} file${summary.readyToRun === 1 ? "" : "s"})`
                    : "Add files to get started"}
              </Button>
              {summary.hasResults ? (
                <Button
                  variant="ghost"
                  onClick={resetWorkflow}
                  disabled={isTranscribing}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Results below the main card */}
        {summary.hasResults ? (
          <div className="mt-6">
            <TranscriptionResults
              results={results}
              isTranscribing={isTranscribing}
              onRetry={retryResult}
              onRemove={removeResult}
            />
          </div>
        ) : null}

        <RecordingModal
          isOpen={showRecordingModal}
          onClose={() => setShowRecordingModal(false)}
          onRecordingComplete={handleRecordingComplete}
        />
      </div>
    </div>
  )
}
