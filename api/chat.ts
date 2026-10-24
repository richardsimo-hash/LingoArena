export const config = { maxDuration: 30 };
type ChatMessage = { role: "user" | "assistant"; content: string };
type Body = {
  messages?: ChatMessage[]; targetName?: string; nativeName?: string; persona?: string;
  cefr?: string; accent?: string; rollingSummary?: string; sessionTokensUsed?: number;
};
const PERSONA_STYLE: Record<string, string> = {
  barista: "a warm, witty café barista who is curious about people",
  gatekeeper: "a patient, precise language coach who values clear communication",
  guide: "an enthusiastic local tour guide who loves travel and stories",
};
const requestCache = new Map<string, { text: string; provider: string; expiresAt: number }>();

// Local per-instance limiter: avoid a shared module import during Vercel function startup.
const rateWindows = new Map<string, { count: number; resetAt: number }>();
function checkChatRateLimit(req: { headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }, limit: number) {
  const forwarded = req.headers?.["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim()
    || req.socket?.remoteAddress || "unknown";
  const key = `chat:${ip}`;
  const now = Date.now();
  for (const [bucket, value] of rateWindows) if (value.resetAt <= now) rateWindows.delete(bucket);
  const current = rateWindows.get(key);
  if (!current || current.resetAt <= now) {
    rateWindows.set(key, { count: 1, resetAt: now + 60_000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  current.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}
const budget = () => Math.max(1000, Number(process.env.SESSION_TOKEN_BUDGET || 60000));
const timeoutSignal = (ms: number) => AbortSignal.timeout(ms);
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function statusOf(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/http_(\d{3})/i);
  if (/timeout|timed out|abort/i.test(message)) return "timeout";
  if (/quota|insufficient_quota/i.test(message)) return "quota_exceeded";
  if (/model_not_found|model .* not found/i.test(message)) return "model_not_found";
  if (match) {
    const code = Number(match[1]);
    if (code === 401 || code === 403) return "unauthorized";
    if (code === 429) return /quota|insufficient/i.test(message) ? "quota_exceeded" : "rate_limited";
    if (code >= 500) return "provider_error";
  }
  return message.slice(0, 120);
}
async function fetchWithRetry(url: string, init: RequestInit, label: string): Promise<Response> {
  let last: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok) return response;
      const body = await response.text().catch(() => "");
      const compactBody = body.replace(/\s+/g, " ").slice(0, 220);
      const error = new Error(`${label}_http_${response.status}${/insufficient_quota|quota/i.test(body) ? "_insufficient_quota" : ""}${/model_not_found|model .* not found/i.test(body) ? "_model_not_found" : ""}:${compactBody}`);
      last = error;
      if (attempt === 0 && (response.status === 429 || response.status >= 500)) { await delay(350); continue; }
      throw error;
    } catch (error) {
      last = error;
      if (attempt === 0 && error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) { await delay(250); continue; }
      throw error;
    }
  }
  throw last instanceof Error ? last : new Error(`${label}_failed`);
}
async function openAIChat(key: string, system: string, messages: ChatMessage[]) {
  const response = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
    method: "POST", signal: timeoutSignal(12000),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini", temperature: 0.7, max_tokens: 150, messages: [{ role: "system", content: system }, ...messages] }),
  }, "openai_chat");
  const data = await response.json() as { choices?: { message?: { content?: string | null } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("openai_chat_empty");
  return text;
}
async function geminiChat(key: string, system: string, messages: ChatMessage[]) {
  const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_CHAT_MODEL || "gemini-3.8-flash")}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST", signal: timeoutSignal(12000), headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { temperature: 0.7, maxOutputTokens: 150 } }),
  }, "gemini_chat");
  const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
  if (!text) throw new Error("gemini_chat_empty");
  return text;
}
export default async function handler(req: { method?: string; body?: Body; headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }, res: { setHeader?: (k: string, v: string) => void; status: (n: number) => { json: (v: unknown) => void } }) {
  try {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed", provider: "none", status: 405 });
  const rate = checkChatRateLimit(req, 30);
  if (!rate.allowed) { res.setHeader?.("Retry-After", String(rate.retryAfterSeconds)); return res.status(429).json({ ok: false, error: "rate_limited", provider: "none", status: 429, retryAfterSeconds: rate.retryAfterSeconds }); }
  const data = req.body ?? {};
  const target = String(data.targetName || "the target language").slice(0, 80);
  const native = String(data.nativeName || "the learner's native language").slice(0, 80);
  const cefr = String(data.cefr || "B1").slice(0, 8);
  const accent = String(data.accent || "Auto").slice(0, 60);
  const persona = PERSONA_STYLE[String(data.persona || "guide")] || PERSONA_STYLE.guide;
  const history: ChatMessage[] = (Array.isArray(data.messages) ? data.messages : []).slice(-12).map((m) => ({
    role: m?.role === "assistant" ? "assistant" : "user", content: String(m?.content || "").slice(0, 800),
  }));
  if (!history.length) history.push({ role: "user", content: "Start the conversation: greet me warmly and ask one natural question." });
  const summary = String(data.rollingSummary || "").slice(0, 900);
  const approxInputTokens = Math.ceil((JSON.stringify(history).length + summary.length) / 4);
  const sessionTokensUsed = Math.max(0, Number(data.sessionTokensUsed) || 0);
  // Budget is diagnostic only: never block a healthy provider because a client estimate is high.
  const estimatedSessionTokens = sessionTokensUsed + approxInputTokens;
  const system = [
    `You are Chloe, a warm, curious language tutor. Persona: ${persona}. Learner speaks ${native}, learns ${target}, CEFR ${cefr}, accent ${accent}.`,
    `Speak mostly in ${target}, suitable for ${cefr}. Reply in 2-4 short spoken sentences, no markdown or emoji. Answer the real question with one useful detail/example, then ask one relevant follow-up. Recast errors naturally; do not overcorrect. Remember the conversation.`,
    `Return ONLY JSON: {"reply":"spoken response","correction":"brief optional correction or empty string"}.`,
    summary ? `Earlier context summary: ${summary}` : "",
  ].filter(Boolean).join(" ");
  const cacheKey = JSON.stringify({ target, native, cefr, accent, persona, summary, history });
  const cached = requestCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return res.status(200).json({ text: cached.text, provider: cached.provider, cached: true, estimatedSessionTokens, budget: budget() });
  const errors: Record<string, string> = {};
  if (process.env.GEMINI_API_KEY) {
    try {
      const text = await geminiChat(process.env.GEMINI_API_KEY, system, history);
      requestCache.set(cacheKey, { text, provider: "gemini", expiresAt: Date.now() + 5 * 60_000 });
      return res.status(200).json({ text, provider: "gemini", approxInputTokens, estimatedSessionTokens, budget: budget(), failover: errors });
    } catch (error) { errors.gemini = statusOf(error); console.warn("[LingoArena API] Gemini failed; client phrasebook fallback", errors.gemini); }
  } else errors.gemini = "missing_key";
  if (process.env.OPENAI_API_KEY) {
    try {
      const text = await openAIChat(process.env.OPENAI_API_KEY, system, history);
      requestCache.set(cacheKey, { text, provider: "openai", expiresAt: Date.now() + 5 * 60_000 });
      return res.status(200).json({ text, provider: "openai", approxInputTokens, estimatedSessionTokens, budget: budget() });
    } catch (error) { errors.openai = statusOf(error); console.warn("[LingoArena API] OpenAI failed; request-level failover", errors.openai); }
  } else errors.openai = "missing_key";
  return res.status(503).json({ ok: false, error: "providers_unavailable", provider: "gemini_then_openai", status: 503, details: errors, fallback: "local_phrasebook" });
  } catch (error) {
    console.error("[LingoArena API] Unhandled chat handler error", error);
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "internal_error", provider: "server", status: 500 });
  }
}
