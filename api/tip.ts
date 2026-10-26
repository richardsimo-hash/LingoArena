/**
 * Short grammar explanation for a unit, written in the learner's language (Gemini free tier).
 * Results are cached per instance; the client also caches them, so each tip is generated once.
 */
type RequestLike = { method?: string; body?: Record<string, unknown>; headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } };
type ResponseLike = { setHeader?: (k: string, v: string) => void; status: (n: number) => { json: (v: unknown) => void } };

const cache = new Map<string, string>();
const windows = new Map<string, { count: number; resetAt: number }>();
function allowed(req: RequestLike) {
  const forwarded = req.headers?.["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const current = windows.get(ip);
  if (!current || current.resetAt <= now) { windows.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (current.count >= 10) return false;
  current.count++;
  return true;
}
const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader?.("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!allowed(req)) return res.status(429).json({ ok: false, error: "rate_limited" });
  const b = req.body || {};
  const target = str(b.targetName, 40), native = str(b.nativeName, 40), focus = str(b.focus, 120), title = str(b.title, 80), level = str(b.level, 4);
  const examples = (Array.isArray(b.examples) ? b.examples : []).slice(0, 4).map((e) => str(e, 160)).filter(Boolean);
  if (!target || !native || !focus) return res.status(400).json({ ok: false, error: "invalid_request" });
  const key = JSON.stringify([target, native, focus, examples]);
  const hit = cache.get(key);
  if (hit) return res.status(200).json({ ok: true, text: hit, cached: true });
  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
  if (!apiKey) return res.status(503).json({ ok: false, error: "ai_missing_key" });
  const prompt = [
    `Write a short grammar tip for a ${level} learner of ${target} whose language is ${native}. Write the whole tip in ${native}.`,
    `Unit: "${title}". Focus: ${focus}.`,
    examples.length ? `Use these course phrases as examples (quote them in ${target}): ${examples.join(" | ")}` : "",
    `Format: 3 to 5 short bullet points starting with "• ", plain text, no markdown headings, friendly and simple enough for a teenager. Include one common mistake ${native} speakers make and how to avoid it.`,
  ].filter(Boolean).join("\n");
  for (const model of [...new Set([process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-flash-latest"])]) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST", signal: AbortSignal.timeout(15_000), headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 400 } }),
      });
      if (!r.ok) continue;
      const data = await r.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
      if (!text) continue;
      if (cache.size > 500) cache.clear();
      cache.set(key, text);
      return res.status(200).json({ ok: true, text });
    } catch { /* try next model */ }
  }
  return res.status(503).json({ ok: false, error: "ai_unavailable" });
}
