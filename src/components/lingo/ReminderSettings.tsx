import { useEffect, useState } from "react";
import { currentSubscription, disablePush, downloadReminder, enablePush, pushConfigured, reminderHour, setReminderHour } from "@/lib/reminders";
import { makeT } from "@/lib/lingo/i18n";
import type { NativeLang } from "@/lib/lingo/content";

/** Settings section: reminder time, calendar reminder, and push notifications when available. */
export function ReminderSettings({ native, lastActive }: { native: NativeLang; lastActive: string | null }) {
  const t = makeT(native);
  const [hour, setHour] = useState(reminderHour());
  const [push, setPush] = useState<"off" | "on" | "denied" | "failed">("off");
  useEffect(() => { void currentSubscription().then((sub) => setPush(sub ? "on" : "off")).catch(() => undefined); }, []);
  const changeHour = (h: number) => {
    setHour(h); setReminderHour(h);
    if (push === "on") void enablePush(native, lastActive); // re-save the new hour
  };
  return (
    <div className="mb-5 space-y-2">
      <label htmlFor="reminder-hour" className="block text-xs font-extrabold uppercase text-muted-foreground">⏰ {t("dailyReminder")}</label>
      <div className="flex gap-2">
        <select id="reminder-hour" value={hour} onChange={(e) => changeHour(Number(e.target.value))} className="min-w-0 flex-1 rounded-2xl border-2 border-border bg-background p-3 font-bold">
          {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{new Date(2000, 0, 1, h).toLocaleTimeString(native, { hour: "numeric", minute: "2-digit" })}</option>)}
        </select>
        <button type="button" onClick={() => downloadReminder(hour, t("reminderTitle"), t("reminderBody"))} className="shrink-0 rounded-2xl border-2 border-border px-3 text-sm font-extrabold hover:bg-muted">📅 {t("addToCalendar")}</button>
      </div>
      {pushConfigured && (
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-muted p-3">
          <span className="font-bold">🔔 {t("pushReminders")}{push === "denied" && <span className="block text-xs text-destructive">{t("pushDenied")}</span>}</span>
          <input type="checkbox" className="h-5 w-5" checked={push === "on"} onChange={async (e) => {
            if (e.target.checked) setPush(await enablePush(native, lastActive));
            else { await disablePush(); setPush("off"); }
          }} />
        </label>
      )}
    </div>
  );
}
