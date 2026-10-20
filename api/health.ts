import { checkRateLimit } from "../server/rateLimit";
type ProviderStatus = "ok" | "missing_key" | "unauthorized" | "model_not_found" | "quota_exceeded" | "rate_limited" | "timeout" | "provider_error";
async function checkOpenAI(): Promise<ProviderStatus> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return "missing_key";
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", signal: AbortSignal.timeout(5000), headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini", messages: [{ role: "user", content: "Reply with OK." }], max_tokens: 2 }) });
    if (r.ok) return "ok";
    const body = await r.text().catch(() => "");
    if (r.status === 401 || r.status === 403) return "unauthorized";
    if (r.status === 404 || /model_not_found|model .* not found/i.test(body)) return "model_not_found";
    if (r.status === 429) return /quota|insufficient_quota/i.test(body) ? "quota_exceeded" : "rate_limited";
    return "provider_error";
  } catch (e) { return e instanceof Error && /timeout|abort/i.test(`${e.name} ${e.message}`) ? "timeout" : "provider_error"; }
}
async function checkGemini(): Promise<ProviderStatus> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return "missing_key";
  try {
    const model = process.env.GEMINI_CHAT_MODEL || "gemini-3.8-flash";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", signal: AbortSignal.timeout(5000), headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: "Reply OK." }] }], generationConfig: { maxOutputTokens: 2 } }) });
    if (r.ok) return "ok";
    const body = await r.text().catch(() => "");
    if (r.status === 401 || r.status === 403) return "unauthorized";
    if (r.status === 404 || /model_not_found|model .* not found/i.test(body)) return "model_not_found";
    if (r.status === 429) return /quota|limit/i.test(body) ? "quota_exceeded" : "rate_limited";
    return "provider_error";
  } catch (e) { return e instanceof Error && /timeout|abort/i.test(`${e.name} ${e.message}`) ? "timeout" : "provider_error"; }
}
export default async function handler(req: { method?: string; headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }, res: { setHeader: (k: string, v: string) => void; status: (n: number) => { json: (v: unknown) => void } }) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  const rate = checkRateLimit(req, "health", 8);
  if (!rate.allowed) { res.setHeader("Retry-After", String(rate.retryAfterSeconds)); return res.status(429).json({ error: "rate_limited", retryAfterSeconds: rate.retryAfterSeconds }); }
  res.setHeader("Cache-Control", "no-store");
  const [openai, gemini] = await Promise.all([checkOpenAI(), checkGemini()]);
  return res.status(200).json({
    providers: { openai, gemini },
    models: { openaiChat: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini", openaiTts: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts", openaiStt: process.env.OPENAI_STT_MODEL || "whisper-1", geminiChat: process.env.GEMINI_CHAT_MODEL || "gemini-3.8-flash", geminiTts: process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts", geminiStt: process.env.GEMINI_STT_MODEL || "gemini-3.8-flash" },
    runtime: { node: process.version, region: process.env.VERCEL_REGION || "unknown", deployment: process.env.VERCEL_ENV || "unknown" },
    configured: { openai: Boolean(process.env.OPENAI_API_KEY), gemini: Boolean(process.env.GEMINI_API_KEY) },
    checkedAt: new Date().toISOString(), sessionTokenBudget: Number(process.env.SESSION_TOKEN_BUDGET || 60000),
  });
}
