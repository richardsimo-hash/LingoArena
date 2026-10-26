/** Daily practice reminders: a calendar (.ics) reminder that works everywhere, and web push when configured. */
const VAPID = (import.meta.env as Record<string, string | undefined>).VITE_VAPID_PUBLIC_KEY || "";
const HOUR_KEY = "lingoarena-reminder-hour";

export const pushConfigured = Boolean(VAPID) && typeof window !== "undefined" && "PushManager" in window && "serviceWorker" in navigator;

export function reminderHour(): number {
  try { const h = Number(localStorage.getItem(HOUR_KEY)); return Number.isInteger(h) && h >= 0 && h < 24 && localStorage.getItem(HOUR_KEY) !== null ? h : 19; } catch { return 19; }
}
export function setReminderHour(hour: number) { try { localStorage.setItem(HOUR_KEY, String(hour)); } catch { /* storage blocked */ } }

/** A daily repeating calendar event with an alarm, linking back to the app. */
export function reminderIcs(hour: number, title: string, description: string, url: string, now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = new Date(now); start.setHours(hour, 0, 0, 0);
  if (start <= now) start.setDate(start.getDate() + 1);
  const local = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const end = new Date(start.getTime() + 10 * 60_000);
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const esc = (v: string) => v.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LingoArena//Reminder//EN", "BEGIN:VEVENT",
    `UID:lingoarena-daily-${hour}@lingoarena`, `DTSTAMP:${stamp}`, `DTSTART:${local(start)}`, `DTEND:${local(end)}`,
    "RRULE:FREQ=DAILY", `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(`${description} ${url}`)}`, `URL:${url}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(title)}`, "TRIGGER:PT0M", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}

export function downloadReminder(hour: number, title: string, description: string) {
  const url = URL.createObjectURL(new Blob([reminderIcs(hour, title, description, window.location.origin)], { type: "text/calendar" }));
  const a = document.createElement("a"); a.href = url; a.download = "lingoarena-daily-reminder.ics"; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function post(action: string, subscription: PushSubscription, extra: Record<string, unknown> = {}) {
  return fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, subscription: subscription.toJSON(), hour: reminderHour(), tzOffsetMin: -new Date().getTimezoneOffset(), ...extra }) });
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushConfigured) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** Asks permission (must be called from a tap) and stores the subscription on the server. */
export async function enablePush(native: string, lastActive: string | null): Promise<"on" | "denied" | "failed"> {
  if (!pushConfigured) return "failed";
  if ((await Notification.requestPermission()) !== "granted") return "denied";
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID) });
  const r = await post("subscribe", sub, { native, lastActive });
  return r.ok ? "on" : "failed";
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  await post("unsubscribe", sub).catch(() => undefined);
  await sub.unsubscribe();
}

/** Tells the server the learner practised today, so no reminder is sent (once per day per device). */
export async function touchPush(native: string, lastActive: string | null) {
  const sub = await currentSubscription().catch(() => null);
  if (!sub || !lastActive) return;
  const key = "lingoarena-push-touched";
  try { if (localStorage.getItem(key) === lastActive) return; localStorage.setItem(key, lastActive); } catch { /* ignore */ }
  await post("touch", sub, { native, lastActive }).catch(() => undefined);
}
