import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { NATIVES, PERSONAS, TARGETS, type NativeLang } from "@/lib/lingo/content";
import { defaultTarget, type Lingo } from "@/lib/lingo/store";
import { getAccent, setAccent } from "@/lib/voice";
import { langName, makeT, type K } from "@/lib/lingo/i18n";
import { Btn } from "./ui";
import { AudioDeviceSettings } from "./AudioDeviceSettings";
import { cn } from "@/lib/utils";

export function Settings({ lingo, onClose }: { lingo: Lingo; onClose: () => void }) {
  const { s, update, reset } = lingo;
  const [native, setNative] = useState(s.native);
  const [target, setTarget] = useState(s.target);
  const [persona, setPersona] = useState(s.persona);
  const [accent, setAccentChoice] = useState(() => getAccent(s.target));
  const [confirm, setConfirm] = useState(false);
  const t = makeT(native); // the dialog itself switches language as soon as the user picks one

  const pickNative = (n: NativeLang) => {
    setNative(n);
    if (target === n) { const next = defaultTarget(n); setTarget(next); setAccentChoice(getAccent(next)); }
  };
  const save = () => { setAccent(target, accent); update({ native, target, persona, configured: true }); onClose(); };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-border bg-card p-6 animate-in zoom-in-95">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-extrabold">{s.configured ? t("settings") : t("welcome")}</h2>
            <p className="text-sm text-muted-foreground">{t("setupSub")}</p>
          </div>
          {s.configured && <button aria-label={t("close")} onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X /></button>}
        </div>

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

        <AudioDeviceSettings />

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

        <Btn className="w-full" onClick={save} disabled={target === native}>{s.configured ? t("save") : t("enter")}</Btn>

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
