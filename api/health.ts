type ProviderStatus = "ok" | "missing_key" | "unauthorized" | "quota_exceeded" | "rate_limited" | "timeout" | "provider_error";
async function checkOpenAI(): Promise<ProviderStatus> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return "missing_key";
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", signal: AbortSignal.timeout(5000), headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini", messages: [{ role: "user", content: "Reply with OK." }], max_tokens: 2 }) });
    if (r.ok) return "ok";
    const body = await r.text().catch(() => "");
    if (r.status === 401 || r.status === 403) return "unauthorized";
    if (r.status === 429) return /quota|insufficient_quota/i.test(body) ? "quota_exceeded" : "rate_limited";
    return "provider_error";
  } catch (e) { return e instanceof Error && /timeout|abort/i.test(`${e.name} ${e.message}`) ? "timeout" : "provider_error"; }
}
async function checkGemini(): Promise<ProviderStatus> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return "missing_key";
  try {
    const model = process.env.GEMINI_CHAT_MODEL || "gemini-2.0-flash";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", signal: AbortSignal.timeout(5000), headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: "Reply OK." }] }], generationConfig: { maxOutputTokens: 2 } }) });
    if (r.ok) return "ok";
    const body = await r.text().catch(() => "");
    if (r.status === 401 || r.status === 403) return "unauthorized";
    if (r.status === 429) return /quota|limit/i.test(body) ? "quota_exceeded" : "rate_limited";
    return "provider_error";
  } catch (e) { return e instanceof Error && /timeout|abort/i.test(`${e.name} ${e.message}`) ? "timeout" : "provider_error"; }
}
export default async function handler(req: { method?: string }, res: { setHeader: (k: string, v: string) => void; status: (n: number) => { json: (v: unknown) => void } }) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  res.setHeader("Cache-Control", "no-store");
  const [openai, gemini] = await Promise.all([checkOpenAI(), checkGemini()]);
  return res.status(200).json({ providers: { openai, gemini }, checkedAt: new Date().toISOString(), sessionTokenBudget: Number(process.env.SESSION_TOKEN_BUDGET || 60000) });
}
