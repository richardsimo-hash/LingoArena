export const config = { maxDuration: 30 };
type Body = { audioBase64?: string; mimeType?: string; locale?: string; diagnosticId?: string };
type RequestLike = { method?: string; body?: Body; headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } };
type ResponseLike = { setHeader?: (k: string, v: string) => void; status: (n: number) => { json: (v: unknown) => void } };
const rateWindows = new Map<string, { count: number; resetAt: number }>();
function localRateLimit(req: RequestLike, limit = 12, windowMs = 60_000) {
  const forwarded = req.headers?.["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const key = `stt:${ip}`; const now = Date.now();
  for (const [bucket, value] of rateWindows) if (value.resetAt <= now) rateWindows.delete(bucket);
  const current = rateWindows.get(key);
  if (!current || current.resetAt <= now) { rateWindows.set(key, { count: 1, resetAt: now + windowMs }); return { allowed: true, retryAfterSeconds: 0 }; }
  if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  current.count++; return { allowed: true, retryAfterSeconds: 0 };
}
function serverLog(requestId: string, stage: string, details: Record<string, unknown> = {}, level: "info" | "warn" | "error" = "info") {
  // Never log the audio payload, transcript, API key, or full request body.
  const entry = JSON.stringify({ app: "lingoarena", route: "/api/stt", requestId, stage, at: new Date().toISOString(), ...details });
  if (level === "error") console.error(entry); else if (level === "warn") console.warn(entry); else console.info(entry);
}
/** OpenAI transcription, used when Gemini fails. Model: OPENAI_STT_MODEL. */
async function openaiTranscribe(key: string, bytes: Buffer, mimeType: string, locale: string): Promise<string> {
  const extension = /wav/.test(mimeType) ? "wav" : /mp4|m4a|aac/.test(mimeType) ? "mp4" : /ogg/.test(mimeType) ? "ogg" : "webm";
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type: mimeType }), `speech.${extension}`);
  form.append("model", process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe");
  form.append("language", locale.slice(0, 2).toLowerCase());
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST", signal: AbortSignal.timeout(15_000), headers: { Authorization: `Bearer ${key}` }, body: form,
  });
  if (!response.ok) throw new Error(`openai_stt_http_${response.status}: ${(await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 200)}`);
  const data = await response.json() as { text?: string };
  const text = (data.text || "").trim();
  if (!text) throw new Error("openai_stt_empty");
  return text;
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  const incomingId = req.headers?.["x-lingo-request-id"];
  const requestId = (Array.isArray(incomingId) ? incomingId[0] : incomingId) || req.body?.diagnosticId || `stt-server-${Date.now().toString(36)}`;
  const startedAt = Date.now();
  res.setHeader?.("x-lingo-request-id", requestId);
  res.setHeader?.("Cache-Control", "no-store");
  serverLog(requestId, "invocation_started", { method: req.method || "unknown", hasBody: Boolean(req.body), region: process.env.VERCEL_REGION || "unknown", runtime: process.version });
  try {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed", provider: "none", status: 405 });
  const rate = localRateLimit(req, 12);
  if (!rate.allowed) { res.setHeader?.("Retry-After", String(rate.retryAfterSeconds)); return res.status(429).json({ ok: false, error: "rate_limited", provider: "none", status: 429, retryAfterSeconds: rate.retryAfterSeconds }); }
  const { audioBase64, mimeType = "audio/webm", locale = "en-US" } = req.body || {};
  serverLog(requestId, "request_validated", { mimeType, locale, encodedLength: typeof audioBase64 === "string" ? audioBase64.length : 0 });
  if (!audioBase64 || typeof audioBase64 !== "string") return res.status(400).json({ ok: false, error: "audio_required", provider: "none", status: 400 });
  const bytes = Buffer.from(audioBase64, "base64");
  serverLog(requestId, "audio_decoded", { byteLength: bytes.length, durationNotAvailable: true });
  if (!bytes.length || bytes.length > 3 * 1024 * 1024) return res.status(413).json({ ok: false, error: "audio_size_invalid", provider: "none", status: 413 });
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
  if (geminiApiKey) {
    // Gemini returns 503 "high demand" or stalls during spikes. Try the configured model, then
    // lighter fallbacks, each with its own timeout, all inside the 30s function budget.
    const primaryModel = process.env.GEMINI_STT_MODEL || "gemini-3.8-flash";
    const fallbackModels = (process.env.GEMINI_STT_FALLBACK_MODELS || "gemini-flash-latest,gemini-flash-lite-latest").split(",").map((m) => m.trim()).filter(Boolean);
    const models = [...new Set([primaryModel, ...fallbackModels])];
    const deadline = startedAt + 27_000;
    let providerFailure = "gemini_stt_unavailable";
    let providerStatus = 502;
    const failures: string[] = [];
    for (let attempt = 0; attempt < models.length; attempt++) {
      const model = models[attempt]!;
      const remaining = deadline - Date.now();
      if (remaining < 2_000) break;
      // Leave the later models some time instead of letting the first one eat the whole budget.
      const attemptTimeout = attempt === models.length - 1 ? remaining : Math.min(remaining, attempt === 0 ? 12_000 : 8_000);
      serverLog(requestId, "provider_request_started", { provider: "gemini", model, attempt, timeoutMs: attemptTimeout });
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`, {
          method: "POST", signal: AbortSignal.timeout(attemptTimeout), headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: `Transcribe exactly what is spoken in language/locale ${locale}. Return only the transcription, with no commentary.` }, { inlineData: { mimeType, data: audioBase64 } }] }], generationConfig: { temperature: 0, maxOutputTokens: 128 } }),
        });
        serverLog(requestId, "provider_response", { provider: "gemini", model, httpStatus: response.status, elapsedMs: Date.now() - startedAt });
        if (!response.ok) {
          const providerBody = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 240);
          providerStatus = response.status === 429 ? 429 : response.status >= 500 ? 503 : 502;
          throw new Error(`gemini_stt_http_${response.status}${providerBody ? `: ${providerBody}` : ""}`);
        }
        const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
        if (!text) throw new Error("gemini_stt_empty");
        serverLog(requestId, "transcription_succeeded", { provider: "gemini", model, attempt, transcriptLength: text.length, elapsedMs: Date.now() - startedAt });
        return res.status(200).json({ text, provider: "gemini", model, diagnosticId: requestId });
      } catch (error) {
        const message = error instanceof Error ? (error.name === "TimeoutError" ? `timeout after ${attemptTimeout}ms` : error.message) : String(error);
        if (error instanceof Error && error.name === "TimeoutError") providerStatus = 504;
        failures.push(`${model}: ${message.slice(0, 160)}`);
        serverLog(requestId, "provider_failed", { provider: "gemini", model, attempt, error: message.slice(0, 300), elapsedMs: Date.now() - startedAt }, "warn");
        // A 400/403/404 on the primary usually means a bad model name or key; still try fallbacks.
      }
    }
    providerFailure = failures.join(" | ").slice(0, 480) || providerFailure;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const text = await openaiTranscribe(openaiKey, bytes, mimeType, locale);
        serverLog(requestId, "transcription_succeeded", { provider: "openai", transcriptLength: text.length, elapsedMs: Date.now() - startedAt, afterGemini: providerFailure.slice(0, 200) });
        return res.status(200).json({ text, provider: "openai", diagnosticId: requestId });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        serverLog(requestId, "provider_failed", { provider: "openai", error: message.slice(0, 300), elapsedMs: Date.now() - startedAt }, "warn");
        providerFailure = `${providerFailure} | openai: ${message.slice(0, 160)}`;
      }
    }
    return res.status(providerStatus === 504 ? 503 : providerStatus).json({ ok: false, error: providerStatus === 429 ? "gemini_stt_rate_limited" : "gemini_stt_unavailable", details: providerFailure, provider: "gemini", status: providerStatus, diagnosticId: requestId, fallback: "browser_speech_recognition" });
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      const text = await openaiTranscribe(process.env.OPENAI_API_KEY, bytes, mimeType, locale);
      return res.status(200).json({ text, provider: "openai", diagnosticId: requestId });
    } catch (error) {
      return res.status(503).json({ ok: false, error: "stt_unavailable", details: error instanceof Error ? error.message.slice(0, 300) : String(error), provider: "openai", status: 503, diagnosticId: requestId });
    }
  }
  serverLog(requestId, "provider_key_missing", { expectedVariables: ["GEMINI_API_KEY", "GEMINI_KEY"] }, "error");
  return res.status(503).json({ ok: false, error: "gemini_missing_key", provider: "gemini", status: 503, diagnosticId: requestId, fallback: "browser_speech_recognition" });
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    serverLog(requestId, "unhandled_handler_error", { error: message.slice(0, 500), elapsedMs: Date.now() - startedAt }, "error");
    return res.status(500).json({ ok: false, error: "stt_internal_error", details: message.slice(0, 300), provider: "server", status: 500, diagnosticId: requestId });
  }
}
