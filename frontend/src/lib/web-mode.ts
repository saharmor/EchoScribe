const STORAGE_KEY = "echoscribe-openai-api-key"

export const isWebMode = import.meta.env.VITE_WEB_MODE === "true"

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(STORAGE_KEY) ?? ""
}

export function setStoredApiKey(key: string) {
  if (key.trim()) {
    localStorage.setItem(STORAGE_KEY, key.trim())
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}
