import { getSettingsOrThrow, getPortfolioItems, getPricingTiers } from "./data";
import {
  KNOWN_DEFAULTS,
  PROVIDER_DEFAULTS,
  resolveProvider,
  type ProviderId,
} from "./providers";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** DB value wins, then the provider-specific env var, so keys never have to live in the database. */
export function providerApiKey(storedKey: string | null | undefined, provider: ProviderId): string {
  const fromDb = (storedKey || "").trim();
  if (fromDb) return fromDb;
  const env =
    provider === "google"
      ? process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY
      : provider === "openrouter"
        ? process.env.OPENROUTER_API_KEY
        : provider === "openai-compatible"
          ? process.env.OPENAI_API_KEY
          : undefined;
  return (env || "").trim();
}

/**
 * A stored endpoint that is merely the default of a *different* provider is stale
 * (e.g. the ollama URL left behind after switching to Google) — ignore it.
 */
function pickEndpoint(provider: ProviderId, stored?: string | null): string {
  const value = (stored || "").trim().replace(/\/$/, "");
  if (!value) return PROVIDER_DEFAULTS[provider].endpoint;
  if (KNOWN_DEFAULTS.includes(value) && value !== PROVIDER_DEFAULTS[provider].endpoint) {
    return PROVIDER_DEFAULTS[provider].endpoint;
  }
  return value;
}

export async function callAI(messages: ChatMessage[]): Promise<string> {
  const s = await getSettingsOrThrow();
  const [items, tiers] = await Promise.all([getPortfolioItems(), getPricingTiers()]);

  const portfolioList = items
    .map((i) => `- ${i.title} (${i.category}): ${i.description} Tech: ${i.techTags}${i.liveUrl ? ` Live: ${i.liveUrl}` : ""}`)
    .join("\n");

  const pricingList = tiers
    .map((t) => `- ${t.name}: $${t.rangeLow}–$${t.rangeHigh}. ${t.description}`)
    .join("\n");

  const system = [
    s.aiSystemPrompt,
    "",
    `About JJ:\n${s.aboutContent}\n`,
    `Journey:\n${s.journeyContent}\n`,
    `Known projects:\n${portfolioList}\n`,
    `Pricing tiers:\n${pricingList}`,
  ].join("\n");

  const fullMessages = [{ role: "system", content: system }, ...messages];

  const provider = resolveProvider(s.aiProvider);
  const model = (s.aiModel || "").trim() || PROVIDER_DEFAULTS[provider].model;
  const endpoint = pickEndpoint(provider, s.aiEndpoint);
  const apiKey = providerApiKey(s.aiApiKey, provider);
  let reply = "";

  if (provider === "ollama") {
    const base = endpoint.replace(/\/v1\/?$/, "").replace(/\/$/, "");
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: fullMessages,
        stream: false,
        options: { temperature: s.aiTemperature },
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new Error(`Ollama ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    reply = json.message?.content ?? "No response from model.";
  } else {
    if (!apiKey) {
      throw new Error(`Provider "${provider}" has no API key (set it in the Command Center or via env).`);
    }
    const res = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: fullMessages,
        temperature: s.aiTemperature,
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      throw new Error(`${PROVIDER_DEFAULTS[provider].label} (${model}) ${res.status}: ${detail}`);
    }
    const json = await res.json();
    reply = json.choices?.[0]?.message?.content ?? "No response from model.";
  }

  return reply.trim();
}
