import { useEffect, useState } from "react";
import { AUTH_PROVIDERS, type AuthProvider } from "@/lib/auth";
import type { CloudSync } from "@/lib/lingo/sync";
import { X, Trash2, Apple } from "lucide-react";
import { NATIVES, PERSONAS, TARGETS, type NativeLang } from "@/lib/lingo/content";
import { DAILY_GOALS, defaultTarget, type Lingo } from "@/lib/lingo/store";
import { getAccent, setAccent } from "@/lib/voice";
import { langName, makeT, type K } from "@/lib/lingo/i18n";
import { Btn } from "./ui";
import { AudioDeviceSettings } from "./AudioDeviceSettings";
import { ReminderSettings } from "./ReminderSettings";
import { cn } from "@/lib/utils";

export function Settings({ lingo, cloud, onClose }: { lingo: Lingo; cloud: CloudSync; onClose: () => void }) {
  const { s, update, reset } = lingo;
  const [native, setNative] = useState(s.native);
  const [target, setTarget] = useState(s.target);
  const [persona, setPersona] = useState(s.persona);
  const [name, setName] = useState(s.name);
  const cleanName = name.replace(/\s+/g, " ").trim().slice(0, 40);
  // Signing in can fill the name from the account; adopt it unless the learner already typed one.
  useEffect(() => { if (s.name && !name) setName(s.name); }, [s.name]); // eslint-disable-line react-hooks/exhaustive-deps
  const [accent, setAccentChoice] = useState(() => getAccent(s.target));
  const [confirm, setConfirm] = useState(false);
  const t = makeT(native); // the dialog itself switches language as soon as the user picks one

  const pickNative = (n: NativeLang) => {
    setNative(n);
    if (target === n) { const next = defaultTarget(n); setTarget(next); setAccentChoice(getAccent(next)); }
  };
  const save = () => { if (!cleanName) return; setAccent(target, accent); update({ name: cleanName, native, target, persona, configured: true }); onClose(); };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-border bg-card p-6 animate-in zoom-in-95">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-extrabold">{s.configured ? t("settings") : t("welcome")}</h2>
            <p className="text-sm text-muted-foreground">{t("setupSub")}</p>
          </div>
          {s.configured && s.name && <button aria-label={t("close")} onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X /></button>}
        </div>

        <label htmlFor="learner-name" className="mb-1 block text-xs font-extrabold uppercase text-muted-foreground">{t("yourName")}</label>
        <input id="learner-name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && cleanName && target !== native && save()} autoFocus={!s.name} maxLength={40} autoComplete="given-name" placeholder={t("namePlaceholder")}
          className="mb-1 w-full rounded-2xl border-2 border-border bg-background p-3 text-lg font-bold outline-none focus:border-primary" />
        <p className="mb-4 text-xs text-muted-foreground">{t("nameHint")}</p>

        <label className="mb-1 block text-xs font-extrabold uppercase text-muted-foreground">{t("iSpeak")}</label>
        <select value={native} onChange={(e) => pickNative(e.target.value as NativeLang)} className="mb-4 w-full rounded-2xl border-2 border-border bg-background p-3 font-bold">
          {NATIVES.map((n) => <option key={n.id} value={n.id}>{langName(n.id, n.id)}</option>)}
        </select>

        <label className="mb-2 block text-xs font-extrabold uppercase text-muted-foreground">{t("iLearn")}</label>
        <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {TARGETS.filter((x) => x.id !== native).map((x) => (
            <button key={x.id} onClick={() => { setTarget(x.id); setAccentChoice(getAccent(x.id)); }}
              className={cn("rounded-2xl border-2 p-2 text-center font-bold transition", target === x.id ? "border-primary bg-accent text-accent-foreground" : "border-border hover:bg-muted")}>
              <div className="text-2xl">{x.flag}</div><div className="text-xs">{langName(x.id, native)}</div>
            </button>
          ))}
        </div>

        <label className="mb-2 block text-xs font-extrabold uppercase text-muted-foreground">Speaking accent</label>
        <select value={accent} onChange={(e) => setAccentChoice(e.target.value)} className="mb-5 w-full rounded-2xl border-2 border-border bg-background p-3 font-bold">
          {(target === "en" ? [["auto", "Auto"], ["en-US", "English — United States"], ["en-GB", "English — United Kingdom"], ["en-AU", "English — Australia"], ["en-IN", "English — India"]]
            : target === "es" ? [["auto", "Auto"], ["es-ES", "Español — España"], ["es-MX", "Español — México"], ["es-AR", "Español — Argentina"], ["es-DO", "Español — República Dominicana"]]
            : target === "pt" ? [["auto", "Auto"], ["pt-BR", "Português — Brasil"], ["pt-PT", "Português — Portugal"]]
            : target === "fr" ? [["auto", "Auto"], ["fr-FR", "Français — France"], ["fr-CA", "Français — Canada"]]
            : target === "de" ? [["auto", "Auto"], ["de-DE", "Deutsch — Deutschland"], ["de-AT", "Deutsch — Österreich"]]
            : target === "it" ? [["auto", "Auto"], ["it-IT", "Italiano — Italia"]]
            : [["auto", "Auto"], ["ja-JP", "日本語 — 日本"]]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>

        <label className="mb-2 block text-xs font-extrabold uppercase text-muted-foreground">{t("dailyGoal")}</label>
        <div className="mb-5 grid grid-cols-4 gap-2">
          {DAILY_GOALS.map((goal) => (
            <button key={goal} onClick={() => update({ dailyGoal: goal })} className={cn("rounded-2xl border-2 p-2 font-extrabold transition", s.dailyGoal === goal ? "border-primary bg-accent text-accent-foreground" : "border-border hover:bg-muted")}>
              {goal}<span className="block text-[10px] font-bold opacity-70">XP</span>
            </button>
          ))}
        </div>

        <ReminderSettings native={native} lastActive={s.lastActive} />

        <AudioDeviceSettings native={native} />

        <label className="mb-2 block text-xs font-extrabold uppercase text-muted-foreground">{t("persona")}</label>
        <div className="mb-5 space-y-2">
          {PERSONAS.map((p) => (
            <button key={p.id} onClick={() => setPersona(p.id)}
              className={cn("flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition", persona === p.id ? "border-primary bg-accent text-accent-foreground" : "border-border hover:bg-muted")}>
              <span className="text-3xl">{p.emoji}</span>
              <span><span className="block font-extrabold">{t(`p_${p.id}` as K)}</span><span className="text-sm opacity-80">{t(`p_${p.id}_b` as K)}</span></span>
            </button>
          ))}
        </div>

        <div className="mb-5 flex items-center justify-between rounded-2xl bg-muted p-3">
          <span className="font-bold">{t("dark")}</span>
          <button onClick={() => update({ dark: !s.dark })} className={cn("h-7 w-12 rounded-full p-1 transition", s.dark ? "bg-primary" : "bg-locked")}>
            <span className={cn("block h-5 w-5 rounded-full bg-card transition", s.dark && "translate-x-5")} />
          </button>
        </div>

        <Btn className="w-full" onClick={save} disabled={target === native || !cleanName}>{s.configured ? t("save") : t("enter")}</Btn>

        {cloud.configured && <AccountSection cloud={cloud} t={t} />}

        {s.configured && (
          <div className="mt-4 border-t-2 border-border pt-4">
            {confirm ? (
              <div className="flex gap-2">
                <Btn variant="danger" className="flex-1" onClick={() => { reset(); setConfirm(false); }}>{t("wipe")}</Btn>
                <Btn variant="ghost" className="flex-1" onClick={() => setConfirm(false)}>{t("cancel")}</Btn>
              </div>
            ) : (
              <button onClick={() => setConfirm(true)} className="flex w-full items-center justify-center gap-2 text-sm font-bold text-destructive"><Trash2 className="h-4 w-4" /> {t("resetAll")}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const PROVIDER_LABEL: Record<AuthProvider, string> = { google: "Google", apple: "Apple", azure: "Microsoft" };

/** Optional sign-in, shown at the bottom of the dialog under the name/language settings. */
function AccountSection({ cloud, t }: { cloud: CloudSync; t: ReturnType<typeof makeT> }) {
  const [busy, setBusy] = useState<AuthProvider | null>(null);
  return (
    <div className="mt-5 space-y-3 border-t-2 border-border pt-4">
      <div>
        <p className="font-extrabold">☁️ {t("syncTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("syncHint")}</p>
      </div>
      {cloud.account ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{t("signedInAs", { who: cloud.account.email || cloud.account.name || PROVIDER_LABEL[cloud.account.provider as AuthProvider] || "" })}</p>
            <p role="status" className={cn("text-xs font-bold", cloud.status === "error" ? "text-destructive" : "text-muted-foreground")}>
              {cloud.status === "syncing" ? t("syncing") : cloud.status === "error" ? `${t("syncError")}: ${cloud.error}` : t("synced")}
            </p>
          </div>
          <button onClick={() => void cloud.signOut()} className="shrink-0 rounded-xl border-2 border-border px-3 py-2 text-xs font-extrabold hover:bg-background">{t("signOut")}</button>
        </div>
      ) : (
        <div className="grid gap-2">
          {AUTH_PROVIDERS.map((provider) => (
            <button key={provider} disabled={busy !== null} onClick={() => { setBusy(provider); void cloud.signIn(provider).finally(() => setBusy(null)); }}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background p-3 font-bold transition hover:bg-muted disabled:opacity-60">
              <ProviderMark provider={provider} />{busy === provider ? "…" : t("continueWith", { p: PROVIDER_LABEL[provider] })}
            </button>
          ))}
          {cloud.status === "error" && <p role="status" className="text-xs font-bold text-destructive">{t("syncError")}: {cloud.error}</p>}
        </div>
      )}
    </div>
  );
}

/** Small monochrome provider marks (simple shapes, not the official logos). */
function ProviderMark({ provider }: { provider: AuthProvider }) {
  if (provider === "azure") return <span aria-hidden className="grid grid-cols-2 gap-0.5"><i className="h-2 w-2 bg-[#f25022]" /><i className="h-2 w-2 bg-[#7fba00]" /><i className="h-2 w-2 bg-[#00a4ef]" /><i className="h-2 w-2 bg-[#ffb900]" /></span>;
  if (provider === "apple") return <Apple aria-hidden className="h-5 w-5" />;
  return <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full border-2 border-current text-[10px] font-black">G</span>;
}
