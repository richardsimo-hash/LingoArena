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
  if (current.count >= 30) return false;
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
  const level = body.level === "error" ? "error" : body.level === "warn" ? "warn" : null;
  const area = cleanString(body.area, 50);
  const event = cleanString(body.event, 80);
  if (!level || !area || !event) return res.status(400).json({ ok: false, error: "invalid_event" });
  const rawDetails = body.details && typeof body.details === "object" && !Array.isArray(body.details)
    ? body.details as Record<string, unknown> : {};
  const details: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(rawDetails).slice(0, 12)) {
    if (/audio|transcript|api.?key|secret|authorization|cookie|prompt|body|token|email|name/i.test(key)) continue;
    if (typeof value === "string") details[key.slice(0, 40)] = value.replace(/[\r\n\t]/g, " ").slice(0, 240);
    else if (typeof value === "number" || typeof value === "boolean" || value === null) details[key.slice(0, 40)] = value;
  }
  const eventId = `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const record = {
    app: "lingoarena", route: "/api/diagnostics", eventId,
    at: cleanString(body.at, 40) || new Date().toISOString(), level, area, event,
    path: cleanString(body.path, 100), userAgent: cleanString(body.userAgent, 240), details,
  };
  if (level === "error") console.error(JSON.stringify(record));
  else console.warn(JSON.stringify(record));
  return res.status(202).json({ ok: true, eventId });
}
