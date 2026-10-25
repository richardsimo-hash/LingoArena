import { Buffer } from "node:buffer";

export const config = { maxDuration: 30 };

type Body = { audioBase64?: unknown; mimeType?: unknown; locale?: unknown };
type RequestLike = {
  method?: string;
  body?: Body | string;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
};
type ResponseLike = {
  setHeader?: (key: string, value: string) => void;
  status: (code: number) => { json: (value: unknown) => void };
};

// Keep this route self-contained. A shared-module import failure can prevent a
// Vercel function from loading before its handler-level error handling runs.
const rateWindows = new Map<string, { count: number; resetAt: number }>();
function allowRequest(req: RequestLike, limit = 12, windowMs = 60_000) {
  const forwarded = req.headers?.["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim()
    || req.socket?.remoteAddress || "unknown";
  const key = `stt:${ip}`;
  const now = Date.now();
  for (const [bucket, value] of rateWindows) if (value.resetAt <= now) rateWindows.delete(bucket);
  const current = rateWindows.get(key);
  if (!current || current.resetAt <= now) {
    rateWindows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  current.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}
function safeError(error: unknown): string {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  // Never include request bodies, API keys, or audio bytes in diagnostics.
  return message.replace(/AIza[\w-]{20,}/g, "[redacted-key]").slice(0, 300);
}

export default async function handler(req: RequestLike, res: ResponseLike): Promise<unknown> {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed", provider: "none", status: 405 });

    const rate = allowRequest(req);
    if (!rate.allowed) {
      res.setHeader?.("Retry-After", String(rate.retryAfterSeconds));
      return res.status(429).json({ ok: false, error: "rate_limited", provider: "none", status: 429, retryAfterSeconds: rate.retryAfterSeconds });
    }

    let body: Body;
    if (typeof req.body === "string") {
      try { body = JSON.parse(req.body) as Body; }
      catch { return res.status(400).json({ ok: false, error: "invalid_json_body", provider: "none", status: 400 }); }
    } else body = req.body && typeof req.body === "object" ? req.body : {};

    const audioBase64 = body.audioBase64;
    const mimeType = typeof body.mimeType === "string" ? body.mimeType.slice(0, 100) : "audio/webm";
    const locale = typeof body.locale === "string" ? body.locale.slice(0, 30) : "en-US";
    if (typeof audioBase64 !== "string" || !audioBase64.length) {
      return res.status(400).json({ ok: false, error: "audio_required", provider: "none", status: 400 });
    }
    // Reject huge base64 strings before allocating decoded audio bytes.
    if (audioBase64.length > 4_000_000) return res.status(413).json({ ok: false, error: "audio_size_invalid", provider: "none", status: 413 });
    const bytes = Buffer.from(audioBase64, "base64");
    if (!bytes.length) return res.status(400).json({ ok: false, error: "audio_empty", provider: "none", status: 400 });
    if (bytes.length > 3 * 1024 * 1024) return res.status(413).json({ ok: false, error: "audio_size_invalid", provider: "none", status: 413 });

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
    if (!geminiApiKey) return res.status(503).json({ ok: false, error: "gemini_missing_key", provider: "gemini", status: 503, fallback: "browser_speech_recognition" });

    const model = process.env.GEMINI_STT_MODEL || "gemini-3.8-flash";
    let response: Response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`, {
        method: "POST",
        signal: AbortSignal.timeout(20_000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [
          { text: `Transcribe exactly what is spoken in language/locale ${locale}. Return only the transcription, with no commentary.` },
          { inlineData: { mimeType, data: audioBase64 } },
        ] }] }),
      });
    } catch (error) {
      console.error("[LingoArena API] STT provider request failed", safeError(error));
      return res.status(502).json({ ok: false, error: "gemini_stt_network_error", details: safeError(error), provider: "gemini", status: 502, fallback: "browser_speech_recognition" });
    }

    if (!response.ok) {
      const providerBody = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 220);
      const status = response.status === 429 ? 429 : response.status >= 500 ? 503 : 502;
      const error = `gemini_stt_http_${response.status}${providerBody ? `: ${providerBody}` : ""}`;
      console.warn("[LingoArena API] STT provider rejected request", { status: response.status, model, detail: providerBody });
      return res.status(status).json({ ok: false, error: status === 429 ? "gemini_stt_rate_limited" : "gemini_stt_unavailable", details: error, provider: "gemini", status, fallback: "browser_speech_recognition" });
    }

    const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const transcript = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    if (!transcript) return res.status(502).json({ ok: false, error: "gemini_stt_empty_transcript", provider: "gemini", status: 502, fallback: "browser_speech_recognition" });
    return res.status(200).json({ text: transcript, provider: "gemini", model });
  } catch (error) {
    console.error("[LingoArena API] Unhandled STT handler error", safeError(error));
    return res.status(500).json({ ok: false, error: "stt_handler_internal_error", details: safeError(error), provider: "server", status: 500 });
  }
}
