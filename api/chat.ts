export const config = { maxDuration: 60 };
type ChatMessage = { role: "user" | "assistant"; content: string };
type Body = {
  messages?: ChatMessage[]; targetName?: string; nativeName?: string; persona?: string;
  cefr?: string; accent?: string; rollingSummary?: string; sessionTokensUsed?: number;
  /** Stream plain text (reply, then an optional "§ correction" line) instead of JSON. */
  stream?: boolean; topic?: string; previousTopics?: string[]; nudge?: boolean; learnerName?: string;
};
type StreamingResponse = { setHeader?: (k: string, v: string) => void; status: (n: number) => { json: (v: unknown) => void }; write?: (chunk: string) => void; end?: () => void; flushHeaders?: () => void; statusCode?: number };
const PERSONA_STYLE: Record<string, string> = {
  barista: "a warm, witty café barista who is curious about people",
  gatekeeper: "a patient, precise language coach who values clear communication",
  guide: "an enthusiastic local tour guide who loves travel and stories",
};
const requestCache = new Map<string, { text: string; provider: string; expiresAt: number }>();

// Self-contained, best-effort per-instance limiter avoids a shared-module import
// during Vercel function initialization. Use a shared store for distributed limits.
type RateRequest = { headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } };
const chatRateWindows = new Map<string, { count: number; resetAt: number }>();
function checkChatRateLimit(req: RateRequest, limit: number, windowMs = 60_000): { allowed: boolean; retryAfterSeconds: number } {
  const forwarded = req.headers?.["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const key = `chat:${ip}`;
  const now = Date.now();
  for (const [bucket, value] of chatRateWindows) if (value.resetAt <= now) chatRateWindows.delete(bucket);
  const current = chatRateWindows.get(key);
  if (!current || current.resetAt <= now) {
    chatRateWindows.set(key, { count: 1, resetAt: now + windowMs });
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
    const body = message.split(":").slice(1).join(":").replace(/https?:\/\/[^ ]+/g, "[provider-url]").slice(0, 110).trim();
    if (code === 401 || code === 403) return `unauthorized${body ? `:${body}` : ""}`;
    if (code === 400) return `invalid_request${body ? `:${body}` : ""}`;
    if (code === 404) return `model_not_found${body ? `:${body}` : ""}`;
    if (code === 429) return `${/quota|insufficient/i.test(message) ? "quota_exceeded" : "rate_limited"}${body ? `:${body}` : ""}`;
    if (code >= 500) return `provider_error_http_${code}${body ? `:${body}` : ""}`;
  }
  return message.slice(0, 160);
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
async function geminiChat(key: string, system: string, messages: ChatMessage[]) {
  const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash-lite")}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST", signal: timeoutSignal(25000), headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: 180, responseMimeType: "application/json" } }),
  }, "gemini_chat");
  const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
  if (!text) throw new Error("gemini_chat_empty");
  return text;
}
/** Streams Gemini text to the client as it is generated, so speech can start on the first sentence. */
async function geminiStream(key: string, model: string, system: string, messages: ChatMessage[], res: StreamingResponse): Promise<number> {
  const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`, {
    method: "POST", signal: timeoutSignal(20000), headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: 220, temperature: 0.9 } }),
  });
  if (!response.ok || !response.body) throw new Error(`gemini_chat_http_${response.status}:${(await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 200)}`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", written = 0;
  try {
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      try {
        const data = JSON.parse(line.slice(5)) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
        if (text) {
          if (!written) { res.setHeader?.("Content-Type", "text/plain; charset=utf-8"); res.setHeader?.("Cache-Control", "no-store"); res.setHeader?.("X-Accel-Buffering", "no"); if (res.statusCode !== undefined) res.statusCode = 200; res.flushHeaders?.(); }
          res.write?.(text); written += text.length;
        }
      } catch { /* partial or keep-alive line */ }
    }
  }
  } catch (error) {
    // Text already reached the learner: end that reply rather than appending another model's answer.
    if (written) return written;
    throw error;
  }
  return written;
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
  const topic = String(data.topic || "").slice(0, 120);
  // Only letters, spaces, apostrophes and hyphens: the name goes into the prompt, so nothing else is allowed.
  const learnerName = String(data.learnerName || "").replace(/[^\p{L}\p{M}' -]/gu, "").trim().slice(0, 40);
  const previousTopics = (Array.isArray(data.previousTopics) ? data.previousTopics : []).slice(-6).map((t) => String(t).slice(0, 80));
  if (!history.length) history.push({ role: "user", content: topic ? `Start the conversation about: ${topic}. Greet me warmly in one short sentence and ask one natural, specific question about it.` : "Start the conversation: greet me warmly and ask one natural question." });
  if (data.nudge) history.push({ role: "user", content: "(The learner has been silent for a while. Encourage them in a few words, then ask a simpler, very concrete question about the current topic. Keep it under 20 words.)" });
  const summary = String(data.rollingSummary || "").slice(0, 900);
  const approxInputTokens = Math.ceil((JSON.stringify(history).length + summary.length) / 4);
  const sessionTokensUsed = Math.max(0, Number(data.sessionTokensUsed) || 0);
  // Budget is diagnostic only: never block a healthy provider because a client estimate is high.
  const estimatedSessionTokens = sessionTokensUsed + approxInputTokens;
  const system = [
    `You are Chloe, a warm, curious language tutor having a live spoken conversation. Persona: ${persona}. Learner speaks ${native}, learns ${target}, CEFR ${cefr}, accent ${accent}.`,
    `Speak only in ${target}, at ${cefr} level. Sound like a real person on a call: 1-3 short, natural sentences, contractions, no lists, markdown or emoji. React to what the learner actually said with a genuine comment or a short personal detail, then ask exactly one open, specific follow-up question so they keep talking. Never lecture.`,
    topic ? `Current topic: ${topic}. Stay on it while it is going well. If answers get very short or the topic has had about 6 exchanges, smoothly bridge to a fresh everyday topic${previousTopics.length ? ` (avoid: ${previousTopics.join(", ")})` : ""}.` : "Pick common, everyday topics and change topic smoothly when one runs dry.",
    learnerName ? `The learner's name is ${learnerName}. Greet them by name at the start and use it naturally now and then (not every turn).` : "",
    `If the learner seems lost, simplify your language. If they use ${native}, gently answer in ${target} with simpler words. Recast errors naturally inside your reply; do not overcorrect.`,
    data.stream
      ? `Output the spoken reply as plain text, and naturally reuse the correct form in it (e.g. learner says "I eated", you say "Oh, you ate pizza!"). Then, whenever the learner's last message has a grammar, word-choice or word-order mistake, you MUST add one final line starting with "§" with a very brief correction written in ${native}, e.g. "§ Se dice 'I ate', no 'I eated'." Skip the § line only when their message was correct.`
      : `Return ONLY JSON: {"reply":"spoken response","correction":"brief optional correction or empty string"}.`,
    summary ? `Earlier context summary: ${summary}` : "",
  ].filter(Boolean).join(" ");
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
  if (data.stream && geminiKey) {
    // Live conversation: stream the reply. Try the chat model, then a lighter fallback, before any text is sent.
    const models = [...new Set([process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-flash-latest"])];
    const failures: string[] = [];
    const out = res as StreamingResponse;
    for (const model of models) {
      try {
        const written = await geminiStream(geminiKey, model, system, history, out);
        if (written) { out.end?.(); return; }
        failures.push(`${model}: empty`);
      } catch (error) {
        failures.push(`${model}: ${statusOf(error)}`);
      }
    }
    console.warn("[LingoArena API] Gemini stream failed", failures.join(" | "));
    return res.status(503).json({ ok: false, error: "gemini_unavailable", provider: "gemini", status: 503, details: { gemini: failures.join(" | ").slice(0, 300) }, fallback: "local_phrasebook" });
  }
  const cacheKey = JSON.stringify({ target, native, cefr, accent, persona, summary, history });
  const cached = requestCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return res.status(200).json({ text: cached.text, provider: cached.provider, cached: true, estimatedSessionTokens, budget: budget() });
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
  if (!geminiApiKey) {
    return res.status(503).json({ ok: false, error: "gemini_missing_key", provider: "gemini", status: 503, fallback: "local_phrasebook" });
  }
  try {
    const text = await geminiChat(geminiApiKey, system, history);
    requestCache.set(cacheKey, { text, provider: "gemini", expiresAt: Date.now() + 5 * 60_000 });
    return res.status(200).json({ text, provider: "gemini", approxInputTokens, estimatedSessionTokens, budget: budget() });
  } catch (error) {
    const detail = statusOf(error);
    console.warn("[LingoArena API] Gemini request failed", detail);
    return res.status(503).json({ ok: false, error: "gemini_unavailable", provider: "gemini", status: 503, details: { gemini: detail }, fallback: "local_phrasebook" });
  }
  } catch (error) {
    console.error("[LingoArena API] Unhandled chat handler error", error);
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "internal_error", provider: "server", status: 500 });
  }
}
