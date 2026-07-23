/**
 * OpenRouter client — a single API surfacing many providers (Anthropic,
 * Google, OpenAI, etc.) behind an OpenAI-compatible REST API. No SDK
 * dependency; plain fetch against https://openrouter.ai/api/v1.
 */

const BASE_URL = "https://openrouter.ai/api/v1";

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");
  return apiKey;
}

const PRIMARY_MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-opus-4.8";
const FALLBACK_MODELS = [
  "anthropic/claude-sonnet-5",
  "google/gemini-2.5-flash",
  "openai/gpt-4o",
].filter((m) => m !== PRIMARY_MODEL);

function headers() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
    // Optional but recommended by OpenRouter for analytics/rate-limit routing
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "X-Title": "Coseade AI",
  };
}

export interface GenerateOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  priority?: boolean;
}

/** Calls OpenRouter in JSON mode, falling back to alternate models on 400/404. */
export async function generateJSON<T = unknown>(opts: GenerateOptions): Promise<T> {
  const models = [PRIMARY_MODEL, ...FALLBACK_MODELS];

  let lastError: unknown;
  for (const model of models) {
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          model,
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.maxTokens ?? 4096,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: opts.system },
            { role: "user", content: opts.user },
          ],
        }),
      });

      if (!res.ok) {
        const status = res.status;
        lastError = new Error(`OpenRouter ${status}: ${await res.text()}`);
        if (status === 400 || status === 404) continue;
        throw lastError;
      }

      const body = await res.json();
      const raw = body.choices?.[0]?.message?.content;
      if (!raw) throw new Error("Empty completion");
      return JSON.parse(raw) as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface TextChunk {
  text: string;
}

/** Streaming chat used by the Career Coach. Yields { text } chunks. */
export async function streamChat(opts: {
  system: string;
  messages: ChatMessage[];
  temperature?: number;
}): Promise<AsyncIterable<TextChunk>> {
  const models = [PRIMARY_MODEL, ...FALLBACK_MODELS];

  let lastError: unknown;
  for (const model of models) {
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          model,
          temperature: opts.temperature ?? 0.7,
          max_tokens: 2048,
          stream: true,
          messages: [
            { role: "system", content: opts.system },
            ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (!res.ok || !res.body) {
        const status = res.status;
        lastError = new Error(`OpenRouter ${status}: ${await res.text()}`);
        if (status === 400 || status === 404) continue;
        throw lastError;
      }

      return sseToTextChunks(res.body);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function* sseToTextChunks(body: ReadableStream<Uint8Array>): AsyncIterable<TextChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) yield { text: delta };
        } catch {
          // Ignore malformed SSE fragments (e.g. keep-alive comments)
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
