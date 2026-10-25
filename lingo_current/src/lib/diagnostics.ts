/** Privacy-conscious diagnostics: logs event metadata only, never audio, transcripts, API keys, or request bodies. */
const STORAGE_KEY = "lingoarena-diagnostics-v1";
const MAX_EVENTS = 80;
export type DiagnosticEvent = { at: string; level: "info" | "warn" | "error"; area: string; event: string; details?: Record<string, unknown> };
function safeDetails(details?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!details) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (/audioBase64|api.?key|secret|transcript|authorization|cookie|prompt|rawBody/i.test(key)) continue;
    if (typeof value === "string") out[key] = value.slice(0, 500);
    else if (typeof value === "number" || typeof value === "boolean" || value === null) out[key] = value;
    else if (Array.isArray(value)) out[key] = value.slice(0, 10).map((x) => typeof x === "string" ? x.slice(0, 100) : x);
    else if (typeof value === "object") out[key] = "[object omitted]";
  }
  return out;
}
export function logDiagnostic(area: string, event: string, level: DiagnosticEvent["level"] = "info", details?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const entry: DiagnosticEvent = { at: new Date().toISOString(), level, area, event, details: safeDetails(details) };
  try {
    const old = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as DiagnosticEvent[];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...old, entry].slice(-MAX_EVENTS)));
  } catch { /* diagnostics must never break app behavior */ }
  window.dispatchEvent(new CustomEvent("lingo-diagnostic-event", { detail: entry }));
  const method = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  method(`[LingoArena diagnostic] ${area}.${event}`, entry.details || {});
}
export function getDiagnosticEvents(): DiagnosticEvent[] {
  if (typeof window === "undefined") return [];
  try { return (JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as DiagnosticEvent[]).slice(-MAX_EVENTS); }
  catch { return []; }
}
export function clearDiagnosticEvents() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage may be disabled */ }
}
export function createDiagnosticId(prefix = "stt"): string {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}
