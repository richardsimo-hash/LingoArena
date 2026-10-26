/**
 * Translation reports from learners ("this phrase is wrong / unnatural / has a typo / bad audio").
 * Always written to the function logs; also stored in Supabase `translation_reports` when the
 * server has SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY. The service
 * key never reaches the browser (no VITE_/NEXT_PUBLIC_ prefix).
 */
type RequestLike = { method?: string; body?: Record<string, unknown>; headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } };
type ResponseLike = { setHeader?: (k: string, v: string) => void; status: (n: number) => { json: (v: unknown) => void } };

const REASONS = ["wrong_translation", "unnatural", "typo", "audio"] as const;
const LANGS = ["en", "es", "fr", "de", "it", "pt", "ja"];
const windows = new Map<string, { count: number; resetAt: number }>();
function allowed(req: RequestLike) {
  const forwarded = req.headers?.["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  for (const [key, value] of windows) if (value.resetAt <= now) windows.delete(key);
  const current = windows.get(ip);
  if (!current || current.resetAt <= now) { windows.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (current.count >= 10) return false;
  current.count++;
  return true;
}
const clean = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max) : "");

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader?.("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!allowed(req)) return res.status(429).json({ ok: false, error: "rate_limited" });
  const body = req.body || {};
  const report = {
    concept_id: clean(body.conceptId, 20),
    target: clean(body.target, 2),
    native: clean(body.native, 2),
    phrase_target: clean(body.phraseTarget, 200),
    phrase_native: clean(body.phraseNative, 200),
    reason: clean(body.reason, 30),
    comment: clean(body.comment, 300),
  };
  if (!/^u\d+c\d+$/.test(report.concept_id) || !LANGS.includes(report.target) || !LANGS.includes(report.native) || !REASONS.includes(report.reason as (typeof REASONS)[number])) {
    return res.status(400).json({ ok: false, error: "invalid_report" });
  }
  console.warn(JSON.stringify({ app: "lingoarena", route: "/api/feedback", type: "translation_report", at: new Date().toISOString(), ...report }));

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (url && serviceKey) {
    try {
      const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/translation_reports`, {
        method: "POST", signal: AbortSignal.timeout(8000),
        headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: "return=minimal" },
        body: JSON.stringify(report),
      });
      if (!response.ok) console.error("[LingoArena feedback] Supabase insert failed", response.status, (await response.text().catch(() => "")).slice(0, 200));
      else return res.status(201).json({ ok: true, stored: "database" });
    } catch (error) {
      console.error("[LingoArena feedback] Supabase insert error", error instanceof Error ? error.message : String(error));
    }
  }
  return res.status(202).json({ ok: true, stored: "logs" });
}
