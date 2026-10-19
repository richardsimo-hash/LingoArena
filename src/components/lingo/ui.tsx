import { useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { Mic, MicOff, Volume2, Turtle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRecognition, speak, stopSpeaking } from "@/lib/lingo/audio";
import { makeT } from "@/lib/lingo/i18n";
import type { NativeLang } from "@/lib/lingo/content";

type V = "primary" | "secondary" | "ghost" | "danger" | "warn";
const VARIANTS: Record<V, string> = {
  primary: "bg-primary text-primary-foreground [--btn-shadow:var(--primary-shadow)]",
  secondary: "bg-secondary text-secondary-foreground [--btn-shadow:color-mix(in_oklch,var(--secondary)_70%,black)]",
  ghost: "bg-card text-foreground border-2 border-border [--btn-shadow:var(--border)]",
  danger: "bg-destructive text-destructive-foreground [--btn-shadow:color-mix(in_oklch,var(--destructive)_70%,black)]",
  warn: "bg-flame text-primary-foreground [--btn-shadow:color-mix(in_oklch,var(--flame)_70%,black)]",
};
export function Btn({ variant = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: V }) {
  return <button {...p} className={cn("btn-3d px-5 py-3 text-sm", VARIANTS[variant], className)} />;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-3xl border-2 border-border bg-card p-5 text-card-foreground", className)}>{children}</div>;
}

export function SpeakButtons({ text, locale, rate, native = "en" }: { text: string; locale: string; rate: number; native?: NativeLang }) {
  const t = makeT(native);
  return (
    <div className="flex gap-2">
      <button aria-label={t("listenBtn")} onClick={() => speak(text, locale, rate)} className="btn-3d grid h-11 w-11 place-items-center bg-secondary text-secondary-foreground [--btn-shadow:color-mix(in_oklch,var(--secondary)_70%,black)]"><Volume2 className="h-5 w-5" /></button>
      <button aria-label={t("listenSlow")} onClick={() => speak(text, locale, 0.75)} className="btn-3d grid h-11 w-11 place-items-center border-2 border-border bg-card text-foreground [--btn-shadow:var(--border)]"><Turtle className="h-5 w-5" /></button>
    </div>
  );
}

/**
 * Web Speech recognition. Tap -> listen(onDone) ; tap again -> stop().
 * The LAST transcript is kept in a ref and delivered through onDone when the engine ends,
 * so stopping the mic always evaluates what was said (the old version lost it).
 */
export function useSpeech(locale: string, native: NativeLang = "en") {
  const t = makeT(native);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);
  const lastRef = useRef("");
  useEffect(() => { setSupported(!!getRecognition()); return () => { try { recRef.current?.abort(); } catch {} }; }, []);

  const listen = (onDone: (text: string) => void, onInterim?: (text: string) => void) => {
    const rec = getRecognition();
    if (!rec) { setSupported(false); return; }
    stopSpeaking(); // don't let the mic hear the bot
    rec.lang = locale; rec.interimResults = true; rec.continuous = true; rec.maxAlternatives = 1;
    lastRef.current = "";
    let delivered = false;
    const finish = () => {
      setListening(false);
      if (delivered) return;
      delivered = true;
      if (lastRef.current) onDone(lastRef.current);
    };
    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      lastRef.current = txt.trim();
      onInterim?.(lastRef.current);
    };
    rec.onerror = (e: any) => {
      if (e.error === "aborted") return;
      setError(e.error === "not-allowed" || e.error === "service-not-allowed" ? t("micBlocked") : e.error === "no-speech" ? t("noSpeech") : t("speechErr"));
      finish();
    };
    rec.onend = finish;
    setError(null); setListening(true);
    recRef.current = rec;
    try { rec.start(); } catch { setListening(false); }
  };
  const stop = () => { try { recRef.current?.stop(); } catch {} };
  return { listening, error, supported, listen, stop };
}

export function MicButton({ listening, onClick, big, disabled }: { listening: boolean; onClick: () => void; big?: boolean; disabled?: boolean }) {
  return (
    <button aria-label={listening ? "Stop" : "Mic"} onClick={onClick} disabled={disabled}
      className={cn("btn-3d grid place-items-center rounded-full", big ? "h-24 w-24" : "h-12 w-12",
        listening ? "bg-heart text-primary-foreground animate-pulse-ring [--btn-shadow:color-mix(in_oklch,var(--heart)_70%,black)]" : VARIANTS.secondary)}>
      {disabled ? <MicOff className={big ? "h-10 w-10" : "h-5 w-5"} /> : <Mic className={big ? "h-10 w-10" : "h-5 w-5"} />}
    </button>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-bold uppercase text-muted-foreground"><span>{label}</span><span>{value}%</span></div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all duration-700", value >= 80 ? "bg-primary" : value >= 50 ? "bg-flame" : "bg-destructive")} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
