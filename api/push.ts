/**
 * Stores or removes a web-push reminder subscription (server-side, Supabase service key).
 * Body: { action: "subscribe" | "touch" | "unsubscribe", subscription, hour, tzOffsetMin, lastActive, native }.
 * Inert (503) until SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are configured.
 */
type RequestLike = { method?: string; body?: Record<string, unknown> };
type ResponseLike = { setHeader?: (k: string, v: string) => void; status: (n: number) => { json: (v: unknown) => void } };

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader?.("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return res.status(503).json({ ok: false, error: "push_not_configured" });
  const b = req.body || {};
  const sub = (b.subscription || {}) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const endpoint = typeof sub.endpoint === "string" && /^https:\/\//.test(sub.endpoint) ? sub.endpoint.slice(0, 1000) : "";
  if (!endpoint) return res.status(400).json({ ok: false, error: "invalid_subscription" });
  const rest = `${url.replace(/\/$/, "")}/rest/v1/push_subscriptions`;
  const headers = { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` };
  if (b.action === "unsubscribe") {
    await fetch(`${rest}?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: "DELETE", headers }).catch(() => undefined);
    return res.status(200).json({ ok: true });
  }
  const hour = Number(b.hour), offset = Number(b.tzOffsetMin);
  const lastActive = typeof b.lastActive === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.lastActive) ? b.lastActive : null;
  const row = {
    endpoint,
    p256dh: String(sub.keys?.p256dh || "").slice(0, 200),
    auth: String(sub.keys?.auth || "").slice(0, 100),
    reminder_hour: Number.isInteger(hour) && hour >= 0 && hour < 24 ? hour : 19,
    tz_offset_min: Number.isFinite(offset) ? Math.max(-840, Math.min(840, Math.round(offset))) : 0,
    last_active: lastActive,
    native: ["en", "es", "fr", "de", "it", "pt"].includes(String(b.native)) ? String(b.native) : "en",
  };
  if (!row.p256dh || !row.auth) return res.status(400).json({ ok: false, error: "invalid_subscription" });
  const r = await fetch(rest, { method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row) });
  return r.ok ? res.status(200).json({ ok: true }) : res.status(502).json({ ok: false, error: `store_failed_${r.status}` });
}
