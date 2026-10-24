import { checkRateLimit } from "../server/rateLimit";
export const config = { maxDuration: 30 };
type Body = { audioBase64?: string; mimeType?: string; locale?: string };
export default async function handler(req: { method?: string; body?: Body; headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }, res: { setHeader?: (k: string, v: string) => void; status: (n: number) => { json: (v: unknown) => void } }) {
  try {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed", provider: "none", status: 405 });
  const rate = checkRateLimit(req, "stt", 12);
  if (!rate.allowed) { res.setHeader?.("Retry-After", String(rate.retryAfterSeconds)); return res.status(429).json({ ok: false, error: "rate_limited", provider: "none", status: 429, retryAfterSeconds: rate.retryAfterSeconds }); }
  const { audioBase64, mimeType = "audio/webm", locale = "en-US" } = req.body || {};
  if (!audioBase64 || typeof audioBase64 !== "string") return res.status(400).json({ ok: false, error: "audio_required", provider: "none", status: 400 });
  const bytes = Buffer.from(audioBase64, "base64");
  if (!bytes.length || bytes.length > 3 * 1024 * 1024) return res.status(413).json({ ok: false, error: "audio_size_invalid", provider: "none", status: 413 });
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
  if (geminiApiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_STT_MODEL || "gemini-3.8-flash")}:generateContent?key=${encodeURIComponent(geminiApiKey)}`, {
        method: "POST", signal: AbortSignal.timeout(20000), headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Transcribe exactly what is spoken in language/locale ${locale}. Return only the transcription, with no commentary.` }, { inlineData: { mimeType, data: audioBase64 } }] }] }),
      });
      if (!response.ok) throw new Error(`gemini_stt_http_${response.status}`);
      const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
      if (!text) throw new Error("gemini_stt_empty");
      return res.status(200).json({ text, provider: "gemini" });
    } catch (error) { console.warn("[LingoArena API] Gemini STT failed", error); }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      const form = new FormData();
      const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
      form.append("file", new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], { type: mimeType }), `speech.${ext}`);
      form.append("model", process.env.OPENAI_STT_MODEL || "whisper-1");
      form.append("language", locale.slice(0, 2));
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form });
      if (!response.ok) throw new Error(`openai_stt_http_${response.status}`);
      const data = await response.json() as { text?: string };
      if (!data.text?.trim()) throw new Error("openai_stt_empty");
      return res.status(200).json({ text: data.text.trim(), provider: "openai" });
    } catch (error) { console.warn("[LingoArena API] OpenAI STT failed; trying Gemini", error); }
  }
  const missing = !process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY && !process.env.GEMINI_KEY;
  return res.status(missing ? 503 : 502).json({ ok: false, error: missing ? "missing_key" : "stt_providers_unavailable", provider: "gemini_then_openai", status: missing ? 503 : 502, fallback: "browser_speech_recognition" });
  } catch (error) {
    console.error("[LingoArena API] Unhandled STT handler error", error);
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "internal_error", provider: "server", status: 500 });
  }
}
