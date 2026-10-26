/**
 * Hourly reminder sender, called by .github/workflows/reminders.yml with
 * "Authorization: Bearer $CRON_SECRET". Sends one push to learners whose reminder hour is now
 * (in their time zone) and who have not practised today; prunes expired subscriptions.
 */
import webpush from "web-push";

type RequestLike = { method?: string; headers?: Record<string, string | string[] | undefined> };
type ResponseLike = { status: (n: number) => { json: (v: unknown) => void } };
type Row = { endpoint: string; p256dh: string; auth: string; reminder_hour: number; tz_offset_min: number; last_active: string | null; native: string; last_sent: string | null };

const MESSAGES: Record<string, { title: string; body: string }> = {
  en: { title: "Keep your streak going 🔥", body: "A 5-minute lesson with Chloe keeps your streak alive." },
  es: { title: "¡Mantén tu racha! 🔥", body: "Una lección de 5 minutos con Chloe mantiene tu racha." },
  fr: { title: "Garde ta série 🔥", body: "Une leçon de 5 minutes avec Chloe garde ta série." },
  de: { title: "Halte deine Serie 🔥", body: "Eine 5-Minuten-Lektion mit Chloe hält deine Serie am Leben." },
  it: { title: "Mantieni la serie 🔥", body: "Una lezione di 5 minuti con Chloe mantiene la tua serie." },
  pt: { title: "Mantém a sequência 🔥", body: "Uma lição de 5 minutos com a Chloe mantém a tua sequência." },
};

export default async function handler(req: RequestLike, res: ResponseLike) {
  const auth = req.headers?.authorization;
  const secret = process.env.CRON_SECRET;
  if (!secret || (Array.isArray(auth) ? auth[0] : auth) !== `Bearer ${secret}`) return res.status(401).json({ ok: false });
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY, vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!url || !key || !vapidPublic || !vapidPrivate) return res.status(503).json({ ok: false, error: "push_not_configured" });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@lingoarena.app", vapidPublic, vapidPrivate);
  const rest = `${url.replace(/\/$/, "")}/rest/v1/push_subscriptions`;
  const headers = { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` };
  const rows = await (await fetch(`${rest}?select=*`, { headers })).json() as Row[];
  const now = Date.now();
  let sent = 0, removed = 0;
  for (const row of rows) {
    const local = new Date(now + row.tz_offset_min * 60_000);
    const localDate = local.toISOString().slice(0, 10);
    if (local.getUTCHours() !== row.reminder_hour || row.last_active === localDate || row.last_sent === localDate) continue;
    const message = MESSAGES[row.native] || MESSAGES.en!;
    try {
      await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, JSON.stringify({ ...message, url: "/" }), { TTL: 3600 });
      sent++;
      await fetch(`${rest}?endpoint=eq.${encodeURIComponent(row.endpoint)}`, { method: "PATCH", headers, body: JSON.stringify({ last_sent: localDate }) });
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) { removed++; await fetch(`${rest}?endpoint=eq.${encodeURIComponent(row.endpoint)}`, { method: "DELETE", headers }); }
    }
  }
  return res.status(200).json({ ok: true, checked: rows.length, sent, removed });
}
