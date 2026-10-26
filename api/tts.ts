import { Buffer } from "node:buffer";

export const config = { maxDuration: 60 };
type Body = { text?: string; locale?: string; rate?: number; voice?: string };
type RequestLike = {
  method?: string;
  body?: Body;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
};
type ResponseLike = {
  setHeader: (key: string, value: string) => void;
  status: (code: number) => {
    json: (value: unknown) => void;
    send: (value: Buffer | string) => void;
  };
};

// Keep this route self-contained so a missing/transpilation-failed shared import
// cannot prevent Vercel from loading the TTS function.
const rateWindows = new Map<string, { count: number; resetAt: number }>();
// Warm Vercel instances can reuse successful clips and coalesce duplicate concurrent requests.
// This is best-effort instance-local caching, not persistent storage.
type TtsResult = { bytes: Uint8Array; mimeType: string };
const audioCache = new Map<string, { result: TtsResult; expiresAt: number }>();
const inFlight = new Map<string, Promise<TtsResult>>();
const AUDIO_CACHE_TTL_MS = 30 * 60_000;
const AUDIO_CACHE_MAX_ENTRIES = 80;
/** "alt" is a second character's voice (e.g. Leo in listening scenes). */
const geminiVoice = (alt: boolean) => (alt ? process.env.GEMINI_TTS_VOICE_ALT || "Puck" : process.env.GEMINI_TTS_VOICE || "Kore");
function cacheKeyFor(text: string, locale: string, alt = false): string {
  return `${process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts"}|${geminiVoice(alt)}|${locale}|${text}`;
}
async function cachedGeminiTts(text: string, locale: string, alt = false): Promise<TtsResult> {
  const key = cacheKeyFor(text, locale, alt);
  const now = Date.now();
  for (const [cacheKey, value] of audioCache) if (value.expiresAt <= now) audioCache.delete(cacheKey);
  const cached = audioCache.get(key);
  if (cached) return cached.result;
  const pending = inFlight.get(key);
  if (pending) return pending;
  const request = geminiTts(text, locale, alt);
  inFlight.set(key, request);
  try {
    const result = await request;
    if (audioCache.size >= AUDIO_CACHE_MAX_ENTRIES) {
      const oldestKey = audioCache.keys().next().value;
      if (oldestKey) audioCache.delete(oldestKey);
    }
    audioCache.set(key, { result, expiresAt: Date.now() + AUDIO_CACHE_TTL_MS });
    return result;
  } finally {
    inFlight.delete(key);
  }
}
function classifyTtsError(error: unknown): { status: number; code: string; retryAfterSeconds?: number } {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/gemini_tts_http_(\d{3})/i);
  if (/timeout|timed out|abort/i.test(message)) return { status: 504, code: "gemini_tts_timeout" };
  if (match && Number(match[1]) === 429) {
    const quotaExhausted = /quota|daily limit|limit: 0|resource_exhausted/i.test(message);
    return { status: 429, code: quotaExhausted ? "gemini_tts_quota_exhausted" : "gemini_tts_rate_limited", retryAfterSeconds: 60 };
  }
  if (match && (Number(match[1]) === 401 || Number(match[1]) === 403)) return { status: 502, code: "gemini_tts_auth_error" };
  return { status: 502, code: "gemini_tts_unavailable" };
}
function allowRequest(req: RequestLike): { allowed: boolean; retryAfterSeconds: number } {
  const forwarded = req.headers?.["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim()
    || req.socket?.remoteAddress || "unknown";
  const key = `tts:${ip}`;
  const now = Date.now();
  for (const [bucket, value] of rateWindows) if (value.resetAt <= now) rateWindows.delete(bucket);
  const current = rateWindows.get(key);
  if (!current || current.resetAt <= now) {
    rateWindows.set(key, { count: 1, resetAt: now + 60_000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= 30) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  current.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}

function sendAudio(res: ResponseLike, bytes: Uint8Array, contentType: string): void {
  const audio = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", String(audio.byteLength));
  res.setHeader("Cache-Control", "private, max-age=86400");
  res.setHeader("X-LingoArena-TTS-Provider", "gemini");
  res.status(200).send(audio);
}

function safeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`.slice(0, 400);
  return String(error).slice(0, 400);
}

async function geminiTts(text: string, locale: string, alt = false): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const key = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
  if (!key) throw new Error("gemini_missing_key");

  // Gemini 3.8 TTS uses the Interactions API, not the generateContent audio schema.
  const model = process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts";
  const voice = geminiVoice(alt);
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    signal: AbortSignal.timeout(22_000),
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      model,
      input: [{
        type: "user_input",
        content: [{
          type: "text",
          text,
          annotations: [{ type: "speech_metadata", style: `Read aloud naturally with clear pronunciation in the ${locale} accent.` }],
        }],
      }],
      response_format: { type: "audio", mime_type: "audio/wav", sample_rate: 24000 },
      generation_config: { speech_config: [{ voice }] },
    }),
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 500);
    throw new Error(`gemini_tts_http_${response.status}${detail ? `: ${detail}` : ""}`);
  }

  const data = await response.json() as {
    output_audio?: { data?: string; mime_type?: string };
    output?: Array<{ type?: string; data?: string; mime_type?: string }>;
    steps?: Array<{ content?: Array<{ type?: string; data?: string; mime_type?: string }> }>;
  };
  const audio = data.output_audio
    || data.output?.find((item) => item.type === "audio")
    || data.steps?.flatMap((step) => step.content || []).find((item) => item.type === "audio");
  if (!audio?.data) throw new Error("gemini_tts_empty_audio_response");
  const bytes = new Uint8Array(Buffer.from(audio.data, "base64"));
  if (!bytes.length) throw new Error("gemini_tts_decoded_empty_audio");
  return { bytes, mimeType: audio.mime_type || "audio/wav" };
}

/** OpenAI text-to-speech (MP3), used when Gemini fails. Model/voice: OPENAI_TTS_MODEL, OPENAI_TTS_VOICE. */
// After an out-of-credits/rate-limit answer, skip OpenAI for a while instead of paying a round trip per sentence.
let openAiTtsBlockedUntil = 0;
async function openaiTts(text: string, rate: number, locale: string, alt = false): Promise<TtsResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("openai_missing_key");
  if (Date.now() < openAiTtsBlockedUntil) throw new Error("openai_tts_cooldown");
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST", signal: AbortSignal.timeout(20_000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: alt ? process.env.OPENAI_TTS_VOICE_ALT || "ash" : process.env.OPENAI_TTS_VOICE || "coral",
      input: text,
      // Tone guidance (gpt-4o-mini-tts): sound like a real, warm person, not a robot.
      instructions: process.env.OPENAI_TTS_INSTRUCTIONS || `You are ${alt ? "Leo, a friendly young man" : "Chloe, a warm, upbeat language tutor"} talking with a learner on a friendly call. Speak naturally and expressively with relaxed, conversational pacing, gentle smiles in your voice and natural intonation, like a real person. Pronounce everything clearly with a native ${locale} accent. Never sound robotic or monotone.`,
      response_format: "mp3",
      speed: Math.min(1.5, Math.max(0.7, rate || 1)),
    }),
  });
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 200);
    if (response.status === 429) openAiTtsBlockedUntil = Date.now() + (/insufficient_quota|no credits/i.test(detail) ? 10 * 60_000 : 60_000);
    throw new Error(`openai_tts_http_${response.status}: ${detail}`);
  }
  return { bytes: new Uint8Array(await response.arrayBuffer()), mimeType: "audio/mpeg" };
}

export default async function handler(req: RequestLike, res: ResponseLike): Promise<void> {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "method_not_allowed", provider: "none" });
      return;
    }
    const rate = allowRequest(req);
    if (!rate.allowed) {
      res.setHeader("Retry-After", String(rate.retryAfterSeconds));
      res.status(429).json({ ok: false, error: "rate_limited", provider: "none", retryAfterSeconds: rate.retryAfterSeconds });
      return;
    }
    const text = String(req.body?.text || "").trim().slice(0, 600);
    const locale = String(req.body?.locale || "en-US").slice(0, 20);
    if (!text) {
      res.status(400).json({ ok: false, error: "text_required", provider: "none" });
      return;
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
    const rateValue = Number(req.body?.rate) || 1;
    const alt = req.body?.voice === "alt";
    // OpenAI is the backup voice when Gemini is missing or fails.
    const tryOpenAi = async (geminiDetail: string): Promise<boolean> => {
      if (!process.env.OPENAI_API_KEY) return false;
      try {
        const result = await openaiTts(text, rateValue, locale, alt);
        if (geminiDetail !== "preferred") console.warn("[LingoArena TTS] served by OpenAI after Gemini failure", geminiDetail.slice(0, 200));
        sendAudio(res, result.bytes, "audio/mpeg");
        return true;
      } catch (error) {
        if (!/cooldown/.test(safeError(error))) console.error("[LingoArena TTS] OpenAI fallback failed", safeError(error));
        return false;
      }
    };
    // OpenAI first by default: ~1 s per sentence and tone instructions; Gemini TTS is slower.
    const openAiFirst = (process.env.TTS_PROVIDER_ORDER || "openai,gemini").trim().startsWith("openai");
    let openAiTried = false;
    if (openAiFirst && process.env.OPENAI_API_KEY) {
      openAiTried = true;
      if (await tryOpenAi("preferred")) return;
    }
    if (!geminiApiKey) {
      if (!openAiTried && await tryOpenAi("gemini_missing_key")) return;
      res.status(503).json({ ok: false, error: "gemini_missing_key", provider: "gemini", fallback: "browser_speech_synthesis" });
      return;
    }
    try {
      const result = await cachedGeminiTts(text, locale, alt);
      sendAudio(res, result.bytes, result.mimeType.toLowerCase().includes("mpeg") ? "audio/mpeg" : "audio/wav");
      return;
    } catch (error) {
      const detail = safeError(error);
      const classified = classifyTtsError(error);
      console.error("[LingoArena TTS] Gemini request failed", { code: classified.code, detail });
      if (!openAiTried && await tryOpenAi(detail)) return;
      if (classified.retryAfterSeconds) res.setHeader("Retry-After", String(classified.retryAfterSeconds));
      res.status(classified.status).json({
        ok: false,
        error: classified.code,
        provider: "gemini",
        details: [detail],
        retryAfterSeconds: classified.retryAfterSeconds,
        fallback: "browser_speech_synthesis",
      });
    }
  } catch (error) {
    const detail = safeError(error);
    console.error("[LingoArena TTS] Unhandled handler exception", detail, error);
    res.status(500).json({ ok: false, error: "tts_handler_exception", details: [detail], provider: "server" });
  }
}
