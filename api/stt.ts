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
    serverLog(requestId, "provider_request_started", { provider: "gemini", model: process.env.GEMINI_STT_MODEL || "gemini-3.8-flash" });
    let providerFailure = "gemini_stt_unavailable";
    let providerStatus = 502;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_STT_MODEL || "gemini-3.8-flash")}:generateContent?key=${encodeURIComponent(geminiApiKey)}`, {
        method: "POST", signal: AbortSignal.timeout(25_000), headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Transcribe exactly what is spoken in language/locale ${locale}. Return only the transcription, with no commentary.` }, { inlineData: { mimeType, data: audioBase64 } }] }], generationConfig: { temperature: 0, maxOutputTokens: 128 } }),
      });
      serverLog(requestId, "provider_response", { provider: "gemini", httpStatus: response.status, elapsedMs: Date.now() - startedAt });
      if (!response.ok) {
        const providerBody = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 240);
        providerStatus = response.status === 429 ? 429 : response.status >= 500 ? 503 : 502;
        providerFailure = `gemini_stt_http_${response.status}${providerBody ? `: ${providerBody}` : ""}`;
        throw new Error(providerFailure);
      }
      const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
      if (!text) throw new Error("gemini_stt_empty");
      serverLog(requestId, "transcription_succeeded", { provider: "gemini", transcriptLength: text.length, elapsedMs: Date.now() - startedAt });
      return res.status(200).json({ text, provider: "gemini", diagnosticId: requestId });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      serverLog(requestId, "provider_failed", { provider: "gemini", error: message.slice(0, 300), elapsedMs: Date.now() - startedAt }, "warn");
      if (!providerFailure || providerFailure === "gemini_stt_unavailable") providerFailure = message.slice(0, 260);
    }
    return res.status(providerStatus).json({ ok: false, error: providerStatus === 429 ? "gemini_stt_rate_limited" : "gemini_stt_unavailable", details: providerFailure, provider: "gemini", status: providerStatus, diagnosticId: requestId, fallback: "browser_speech_recognition" });
  }
  serverLog(requestId, "provider_key_missing", { expectedVariables: ["GEMINI_API_KEY", "GEMINI_KEY"] }, "error");
  return res.status(503).json({ ok: false, error: "gemini_missing_key", provider: "gemini", status: 503, diagnosticId: requestId, fallback: "browser_speech_recognition" });
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    serverLog(requestId, "unhandled_handler_error", { error: message.slice(0, 500), elapsedMs: Date.now() - startedAt }, "error");
    return res.status(500).json({ ok: false, error: "stt_internal_error", details: message.slice(0, 300), provider: "server", status: 500, diagnosticId: requestId });
  }
}
