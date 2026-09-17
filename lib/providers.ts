export type ProviderId = "google" | "openrouter" | "ollama" | "openai-compatible";

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  /** Endpoint used when the site settings leave it blank (or leave a different provider's default). */
  endpoint: string;
  /** Model used when the site settings leave it blank. */
  model: string;
  /** Env var checked for a key when the Command Center field is empty. */
  keyEnv: string;
}

/** Single source of truth for provider defaults — shared by the AI client and the Command Center UI. */
export const PROVIDERS: ProviderMeta[] = [
  {
    id: "google",
    label: "Google Gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.5-flash",
    keyEnv: "GEMINI_API_KEY",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    endpoint: "https://openrouter.ai/api/v1",
    model: "google/gemini-2.0-flash-001",
    keyEnv: "OPENROUTER_API_KEY",
  },
  {
    id: "ollama",
    label: "Ollama (homelab)",
    endpoint: "http://192.168.1.154:11434",
    model: "qwen2.5:7b-instruct",
    keyEnv: "OLLAMA_API_KEY",
  },
  {
    id: "openai-compatible",
    label: "OpenAI-compatible",
    endpoint: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    keyEnv: "OPENAI_API_KEY",
  },
];

export const PROVIDER_DEFAULTS = Object.fromEntries(PROVIDERS.map((p) => [p.id, p])) as Record<ProviderId, ProviderMeta>;

export const KNOWN_DEFAULTS = PROVIDERS.map((p) => p.endpoint);

/** Accepts the aliases admins actually type in the Command Center. */
export function resolveProvider(raw?: string | null): ProviderId {
  const p = (raw || "ollama").trim().toLowerCase();
  if (["google", "gemini", "google-gemini", "googleai", "google-ai", "generativelanguage"].includes(p)) return "google";
  if (p === "ollama") return "ollama";
  if (p === "openrouter") return "openrouter";
  return "openai-compatible";
}
