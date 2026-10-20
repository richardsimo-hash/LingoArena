import { checkRateLimit } from "../server/rateLimit";
type Body = { text?: string; locale?: string; rate?: number };
function pcm16ToWav(pcm: Uint8Array, sampleRate = 24000, channels = 1): Uint8Array {
  const out = new Uint8Array(44 + pcm.length);
  const view = new DataView(out.buffer);
  const write = (offset: number, text: string) => { for (let i = 0; i < text.length; i++) out[offset + i] = text.charCodeAt(i); };
  write(0, "RIFF"); view.setUint32(4, 36 + pcm.length, true); write(8, "WAVE"); write(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true); write(36, "data"); view.setUint32(40, pcm.length, true); out.set(pcm, 44);
  return out;
}
function sendAudio(res: { setHeader: (k: string, v: string) => void; status: (n: number) => { send: (v: Uint8Array | string) => void } }, bytes: Uint8Array, type: string) {
  res.setHeader("Content-Type", type); res.setHeader("Content-Length", String(bytes.byteLength)); res.setHeader("Accept-Ranges", "bytes"); res.setHeader("Cache-Control", "private, max-age=86400");
  return res.status(200).send(bytes);
}
export default async function handler(req: { method?: string; body?: Body; headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }, res: { setHeader: (k: string, v: string) => void; status: (n: number) => { json: (v: unknown) => void; send: (v: Uint8Array | string) => void } }) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const rate = checkRateLimit(req, "tts", 30);
  if (!rate.allowed) { res.setHeader("Retry-After", String(rate.retryAfterSeconds)); return res.status(429).json({ error: "rate_limited", retryAfterSeconds: rate.retryAfterSeconds }); }
  const text = String(req.body?.text || "").trim().slice(0, 1600);
  const locale = String(req.body?.locale || "en-US").slice(0, 20);
  if (!text) return res.status(400).json({ error: "text_required" });
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST", signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts", voice: process.env.OPENAI_TTS_VOICE || "nova", input: text, instructions: `Speak naturally using the pronunciation and accent associated with ${locale}.`, response_format: "mp3", speed: Math.min(1.2, Math.max(0.75, Number(req.body?.rate) || 1)) }),
      });
      if (!response.ok) throw new Error(`openai_tts_http_${response.status}`);
      return sendAudio(res, new Uint8Array(await response.arrayBuffer()), "audio/mpeg");
    } catch (error) { console.warn("[LingoArena API] OpenAI TTS failed; trying Gemini", error); }
  } else console.info("[LingoArena API] OPENAI_API_KEY missing for TTS; trying Gemini");

  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts")}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
        method: "POST", signal: AbortSignal.timeout(18000), headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Read aloud naturally in the accent corresponding to ${locale}: ${text}` }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: process.env.GEMINI_TTS_VOICE || "Kore" },
              },
            },
          },
        }),
      });
      if (!response.ok) throw new Error(`gemini_tts_http_${response.status}`);
      const data = await response.json() as { candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[] };
      const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
      if (!part?.data) throw new Error("gemini_tts_empty");
      const raw = Uint8Array.from(atob(part.data), (c) => c.charCodeAt(0));
      const mime = part.mimeType || "audio/L16;rate=24000";
      if (mime.includes("wav") || mime.includes("mpeg") || mime.includes("mp3")) return sendAudio(res, raw, mime.includes("mpeg") || mime.includes("mp3") ? "audio/mpeg" : "audio/wav");
      return sendAudio(res, pcm16ToWav(raw, Number(mime.match(/rate=(\d+)/)?.[1] || 24000)), "audio/wav");
    } catch (error) { console.warn("[LingoArena API] Gemini TTS failed; browser TTS fallback will be used", error); }
  }
  return res.status(503).json({ error: "tts_providers_unavailable" });
}
