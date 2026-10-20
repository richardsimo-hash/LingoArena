import { checkRateLimit } from "../server/rateLimit";
type Body = { audioBase64?: string; mimeType?: string; locale?: string };
export default async function handler(req: { method?: string; body?: Body; headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }, res: { setHeader?: (k: string, v: string) => void; status: (n: number) => { json: (v: unknown) => void } }) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const rate = checkRateLimit(req, "stt", 12);
  if (!rate.allowed) { res.setHeader?.("Retry-After", String(rate.retryAfterSeconds)); return res.status(429).json({ error: "rate_limited", retryAfterSeconds: rate.retryAfterSeconds }); }
  const { audioBase64, mimeType = "audio/webm", locale = "en-US" } = req.body || {};
  if (!audioBase64) return res.status(400).json({ error: "audio_required" });
  const bytes = Buffer.from(audioBase64, "base64");
  if (!bytes.length || bytes.length > 3 * 1024 * 1024) return res.status(413).json({ error: "audio_size_invalid" });
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
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_STT_MODEL || "gemini-3.8-flash")}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
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
  return res.status(503).json({ error: "stt_providers_unavailable", fallback: "browser_speech_recognition" });
}
