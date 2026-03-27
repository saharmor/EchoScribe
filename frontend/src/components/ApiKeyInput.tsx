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
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
          <span className="text-xs text-muted-foreground">
            API key saved
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
        >
          <PencilLine className="h-3 w-3" />
          Edit
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
          <label htmlFor="api-key-input" className="section-label">
            OpenAI API key
          </label>
        </div>

        <div className="flex items-center gap-2">
          {hasKey && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setVisible(false)
              }}
              className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              Done
            </button>
          )}
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

      <div className="relative">
        <input
          id="api-key-input"
          type={visible ? "text" : "password"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="w-full rounded-2xl border border-input bg-white/80 px-4 py-2.5 pr-10 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
          aria-label={visible ? "Hide API key" : "Show API key"}
        >
          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>

      <p className="mt-1.5 text-[0.65rem] leading-4 text-muted-foreground/60">
        Stored in this browser only and sent directly to OpenAI.
      </p>
    </div>
  )
}
