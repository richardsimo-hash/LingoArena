/**
 * Privacy-conscious client diagnostic ingest endpoint.
 * Events are written to Vercel Function Logs; this endpoint does not expose logs publicly.
 * Never accept audio, transcripts, request bodies, credentials, or arbitrary nested objects.
 */
type RequestLike = {
  method?: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
};
type ResponseLike = {
  setHeader?: (name: string, value: string) => void;
  status: (code: number) => { json: (value: unknown) => void };
};
const windows = new Map<string, { count: number; resetAt: number }>();
function limit(req: RequestLike) {
  const forwarded = req.headers?.["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  for (const [key, value] of windows) if (value.resetAt <= now) windows.delete(key);
  const current = windows.get(ip);
  if (!current || current.resetAt <= now) { windows.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (current.count >= 60) return false;
  current.count++;
  return true;
}
function cleanString(value: unknown, max = 160): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.replace(/[\r\n\t]/g, " ").slice(0, max);
}
export default function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader?.("Cache-Control", "no-store");
  res.setHeader?.("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });
  if (!limit(req)) return res.status(429).json({ ok: false, error: "rate_limited" });
  const body = req.body || {};
  const events = Array.isArray(body.events) ? (body.events as Record<string, unknown>[]).slice(0, 20) : [body];
  const session = cleanString(body.session, 40);
  const eventId = `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  let accepted = 0;
  for (const item of events) {
    if (!item || typeof item !== "object") continue;
    const level = item.level === "error" ? "error" : item.level === "warn" ? "warn" : item.level === "info" ? "info" : null;
    const area = cleanString(item.area, 50);
    const event = cleanString(item.event, 80);
    if (!level || !area || !event) continue;
    const rawDetails = item.details && typeof item.details === "object" && !Array.isArray(item.details)
      ? item.details as Record<string, unknown> : {};
    const details: Record<string, string | number | boolean | null> = {};
    for (const [key, value] of Object.entries(rawDetails).slice(0, 32)) {
      if (/audioBase64|transcript|api.?key|secret|authorization|cookie|prompt|body|token|email/i.test(key)) continue;
      if (typeof value === "string") details[key.slice(0, 40)] = value.replace(/[\r\n\t]/g, " ").slice(0, 240);
      else if (typeof value === "number" || typeof value === "boolean" || value === null) details[key.slice(0, 40)] = value;
    }
    const record = {
      app: "lingoarena", route: "/api/diagnostics", eventId, session,
      at: cleanString(item.at, 40) || new Date().toISOString(), level, area, event,
      path: cleanString(body.path ?? item.path, 100), userAgent: cleanString(body.userAgent ?? item.userAgent, 240), details,
    };
    if (level === "error") console.error(JSON.stringify(record));
    else if (level === "warn") console.warn(JSON.stringify(record));
    else console.info(JSON.stringify(record));
    accepted++;
  }
  if (!accepted) return res.status(400).json({ ok: false, error: "invalid_event" });
  return res.status(202).json({ ok: true, eventId });
}
