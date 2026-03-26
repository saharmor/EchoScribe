import { useState, useEffect } from "react"
import { Eye, EyeOff, KeyRound } from "lucide-react"

import { getStoredApiKey, setStoredApiKey } from "@/lib/web-mode"
import { cn } from "@/lib/utils"

export function ApiKeyInput() {
  const [apiKey, setApiKey] = useState(() => getStoredApiKey())
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setStoredApiKey(apiKey)
  }, [apiKey])

  const hasKey = apiKey.trim().length > 0

  return (
    <div className="surface-panel mb-6 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2">
        <KeyRound className="h-4 w-4 text-muted-foreground" />
        <label htmlFor="api-key-input" className="section-label">
          OpenAI API key
        </label>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Your key is stored only in this browser and sent directly to OpenAI — it never touches any
        third-party server.
      </p>
      <div className="relative">
        <input
          id="api-key-input"
          type={visible ? "text" : "password"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className={cn(
            "w-full rounded-xl border border-input bg-white/80 px-4 py-2.5 pr-10 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/20",
            hasKey && "border-green-300 bg-green-50/50",
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Hide API key" : "Show API key"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
