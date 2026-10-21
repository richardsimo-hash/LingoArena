import { Buffer } from "node:buffer";

export const config = { maxDuration: 30 };
type Body = { text?: string; locale?: string; rate?: number };
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

async function geminiTts(text: string, locale: string): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("gemini_missing_key");

  // Gemini 3.8 TTS uses the Interactions API, not the generateContent audio schema.
  const model = process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts";
  const voice = process.env.GEMINI_TTS_VOICE || "Kore";
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

async function openAiTts(text: string, locale: string, rate: number): Promise<Uint8Array> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("openai_missing_key");
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    signal: AbortSignal.timeout(18_000),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: process.env.OPENAI_TTS_VOICE || "nova",
      input: text,
      instructions: `Speak naturally using the pronunciation and accent associated with ${locale}.`,
      response_format: "mp3",
      speed: Math.min(1.2, Math.max(0.75, rate || 1)),
    }),
  });
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 400);
    throw new Error(`openai_tts_http_${response.status}${detail ? `: ${detail}` : ""}`);
  }
  return new Uint8Array(await response.arrayBuffer());
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
    const speechRate = Number(req.body?.rate) || 1;
    if (!text) {
      res.status(400).json({ ok: false, error: "text_required", provider: "none" });
      return;
    }

    const errors: string[] = [];
    if (process.env.GEMINI_API_KEY) {
      try {
        const result = await geminiTts(text, locale);
        sendAudio(res, result.bytes, result.mimeType.toLowerCase().includes("mpeg") ? "audio/mpeg" : "audio/wav");
        return;
      } catch (error) {
        const detail = safeError(error);
        errors.push(detail);
        console.error("[LingoArena TTS] Gemini request failed", detail);
      }
    } else {
      errors.push("gemini_missing_key");
    }

    if (process.env.OPENAI_API_KEY) {
      try {
        const bytes = await openAiTts(text, locale, speechRate);
        sendAudio(res, bytes, "audio/mpeg");
        return;
      } catch (error) {
        const detail = safeError(error);
        errors.push(detail);
        console.error("[LingoArena TTS] OpenAI fallback failed", detail);
      }
    } else {
      errors.push("openai_missing_key");
    }

    res.status(502).json({
      ok: false,
      error: "tts_providers_unavailable",
      provider: "gemini_then_openai",
      details: errors,
      fallback: "browser_speech_synthesis",
    });
  } catch (error) {
    const detail = safeError(error);
    console.error("[LingoArena TTS] Unhandled handler exception", detail, error);
    res.status(500).json({ ok: false, error: "tts_handler_exception", details: [detail], provider: "server" });
  }
}
