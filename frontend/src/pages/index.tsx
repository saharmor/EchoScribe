import { useEffect, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Copy,
  Mic,
  RotateCcw,
  Sparkles,
  Waves,
} from "lucide-react"

import { RecordingModal } from "@/components/RecordingModal"
import { TranscriptionDropzone } from "@/components/TranscriptionDropzone"
import { ApiKeyInput } from "@/components/ApiKeyInput"
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

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")

  useEffect(() => {
    if (state === "idle") return
    const t = window.setTimeout(() => setState("idle"), 2000)
    return () => window.clearTimeout(t)
  }, [state])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState("copied")
    } catch {
      setState("failed")
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {state === "copied" ? (
        <Check className="mr-1.5 h-3.5 w-3.5" />
      ) : state === "failed" ? (
        <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
      ) : (
        <Copy className="mr-1.5 h-3.5 w-3.5" />
      )}
      {state === "copied" ? "Copied" : state === "failed" ? "Failed" : "Copy"}
    </Button>
  )
}

export default function Home() {
  const [showRecordingModal, setShowRecordingModal] = useState(false)
  const {
    canStart,
    errorMessage,
    file,
    handleRecordingComplete,
    isTranscribing,
    prompt,
    reset,
    segments,
    selectFile,
    selectedModel,
    setPrompt,
    setSelectedModel,
    startTranscription,
    status,
    transcript,
  } = useTranscriptionWorkflow()

  const hasResult = status === "completed" && transcript !== null

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        {/* Header */}
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <h1 className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
            EchoScribe
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground sm:text-lg">
            {isWebMode
              ? "Transcribe recordings using OpenAI Whisper. Drop your file, enter your API key, and get a clean transcript in seconds."
              : "Transcribe recordings and generate insights locally or via the cloud. Pick a model, drop your file, and get a clean transcript in seconds."}
          </p>
        </div>

        {isWebMode && (
          <div className="mx-auto max-w-3xl">
            <ApiKeyInput />
          </div>
        )}

        {/* Two-pane layout: config left, result right */}
        <div
          className={cn(
            "grid gap-6",
            hasResult
              ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
              : "mx-auto max-w-3xl",
          )}
        >
          {/* Left: Configuration pane */}
          <div>
            <div className="surface-panel p-6 sm:p-8">
              <div className="space-y-6">
                {/* Model picker */}
                {modelOptions.length > 1 && (
                  <div>
                    <label className="section-label mb-3 block">
                      Transcription model
                    </label>
                    <div
                      className="grid gap-3 sm:grid-cols-2"
                      role="radiogroup"
                      aria-label="Transcription model"
                    >
                      {modelOptions.map(
                        ({ value, title, description, icon: Icon }) => {
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
                                isTranscribing &&
                                  "pointer-events-none opacity-60",
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
                                <span className="block text-sm font-medium text-foreground">
                                  {title}
                                </span>
                                <span className="block text-sm leading-5 text-muted-foreground">
                                  {description}
                                </span>
                              </span>
                            </button>
                          )
                        },
                      )}
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

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Add audio
                  </span>
                  <div className="h-px flex-1 bg-border/60" />
                </div>

                {/* Record + Dropzone */}
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
                  <TranscriptionDropzone
                    onFileDrop={selectFile}
                    currentFile={file}
                    onClear={reset}
                    disabled={isTranscribing}
                  />
                </div>
              </div>
            </div>

            {/* CTA + errors - outside the card */}
            <div className="mt-4 space-y-3">
              {/* Error / warning message */}
              {status === "error" && errorMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p className="text-sm leading-6 text-destructive">
                    {errorMessage}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="flex-1"
                  onClick={startTranscription}
                  disabled={!canStart}
                >
                  {isTranscribing
                    ? "Transcribing..."
                    : status === "error"
                      ? "Retry"
                      : file
                        ? "Transcribe"
                        : "Add a file to get started"}
                </Button>
                {(file || hasResult) && (
                  <Button
                    variant="ghost"
                    onClick={reset}
                    disabled={isTranscribing}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Transcription result pane */}
          {hasResult && (
            <div className="surface-panel flex flex-col p-6 sm:p-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-label">Transcription</h2>
                <CopyButton text={transcript} />
              </div>

              <div className="flex-1 overflow-y-auto rounded-2xl border border-border/60 bg-white/70 p-5">
                <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                  {transcript}
                </div>
              </div>

              {segments.length > 0 && (
                <div className="mt-4">
                  <p className="section-label mb-3">Timeline</p>
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {segments.map((seg, i) => (
                      <div
                        key={`${seg.start}-${seg.end}-${i}`}
                        className="rounded-xl border border-border/60 bg-background/80 px-3 py-2"
                      >
                        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                          {formatTs(seg.start)} – {formatTs(seg.end)}
                        </span>
                        <p className="mt-1 text-sm leading-6 text-foreground">
                          {seg.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <RecordingModal
          isOpen={showRecordingModal}
          onClose={() => setShowRecordingModal(false)}
          onRecordingComplete={handleRecordingComplete}
        />
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/60">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-[1fr_auto_auto]">
            <div>
              <p className="font-serif text-lg font-medium text-foreground">
                EchoScribe
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Audio transcription workspace. Record or upload audio and get
                clean transcripts using OpenAI Whisper.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                More AI Tools
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <FooterLink href="https://www.promptclaude.dev/" label="Prompt Claude" description="Interactive prompt engineering course." />
                <FooterLink href="https://sidekickdev.com/?utm_source=echoscribe" label="Sidekick Dev" description="Context files for AI coding agents." />
                <FooterLink href="https://toolsuse.dev/?utm_source=echoscribe" label="Tool Calls Schema Generator" description="OpenAI & Anthropic tool schemas." />
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Links
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <FooterLink href="https://github.com/saharmor/EchoScribe" label="GitHub" />
                <FooterLink href="https://x.com/theaievangelist" label="X / Twitter" />
                <FooterLink href="https://www.linkedin.com/in/sahar-mor/" label="LinkedIn" />
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
            Built by{" "}
            <a
              href="https://saharmor.me/?utm_source=echoscribe"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition"
            >
              Sahar Mor
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FooterLink({
  href,
  label,
  description,
}: {
  href: string
  label: string
  description?: string
}) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground/80 underline-offset-2 hover:text-foreground hover:underline transition"
      >
        {label}
      </a>
      {description && (
        <span className="block text-xs text-muted-foreground">{description}</span>
      )}
    </li>
  )
}

function formatTs(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}
