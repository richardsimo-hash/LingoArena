type RequestLike = { headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } };
const windows = new Map<string, { count: number; resetAt: number }>();

/** Best-effort per-instance limiter for serverless routes; use an external store for distributed enforcement. */
export function checkRateLimit(req: RequestLike, scope: string, limit: number, windowMs = 60_000): { allowed: boolean; retryAfterSeconds: number } {
  const forwarded = req.headers?.["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const key = `${scope}:${ip}`; const now = Date.now();
  for (const [bucket, value] of windows) if (value.resetAt <= now) windows.delete(bucket);
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  current.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}
