import { useEffect, useState } from "react"
import { CheckCircle2, ExternalLink, Eye, EyeOff, KeyRound, PencilLine } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getStoredApiKey, setStoredApiKey } from "@/lib/web-mode"

export function ApiKeyInput() {
  const [apiKey, setApiKey] = useState(() => getStoredApiKey())
  const [isEditing, setIsEditing] = useState(() => getStoredApiKey().trim().length === 0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setStoredApiKey(apiKey)
  }, [apiKey])

  const hasKey = apiKey.trim().length > 0

  useEffect(() => {
    if (!hasKey) {
      setIsEditing(true)
      setVisible(false)
    }
  }, [hasKey])

  if (hasKey && !isEditing) {
    return (
      <div className="mb-6 rounded-2xl border border-border/70 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-success/15 bg-background/80 text-success">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">OpenAI API key saved</p>
                <p className="text-xs text-muted-foreground">
                  Stored only in this browser.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <PencilLine className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
            >
              Get key
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-2xl border border-border/70 bg-white/55 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <label htmlFor="api-key-input" className="section-label">
                OpenAI API key
              </label>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Stored only in this browser and sent directly to OpenAI.
              {" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline-offset-2 transition hover:text-foreground hover:underline"
              >
                Get one from OpenAI
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          {hasKey && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(false)
                setVisible(false)
              }}
            >
              Done
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              id="api-key-input"
              type={visible ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full rounded-xl border border-input/90 bg-white/80 px-4 py-2.5 pr-10 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              aria-label={visible ? "Hide API key" : "Show API key"}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {hasKey && (
            <p className="text-xs text-muted-foreground sm:shrink-0">
              Saved automatically in this browser.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
