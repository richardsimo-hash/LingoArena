import { useState } from "react";
import { Volume2, X } from "lucide-react";
import { TARGETS, UNITS, unitConcepts } from "@/lib/lingo/content";
import { langName, makeT, unitTitle } from "@/lib/lingo/i18n";
import type { Lingo } from "@/lib/lingo/store";
import { speak } from "@/lib/voice";
import { Btn, Card } from "./ui";

const tipKey = (target: string, native: string, unit: number) => `lingoarena-tip-${target}-${native}-${unit}`;

/** Pattern card for a unit (works offline) plus an optional AI explanation in the learner's language. */
export function GrammarTip({ lingo, unit, onClose }: { lingo: Lingo; unit: number; onClose: () => void }) {
  const { s } = lingo;
  const t = makeT(s.native);
  const info = UNITS[unit]!;
  const tg = TARGETS.find((x) => x.id === s.target)!;
  const examples = unitConcepts(unit).filter((_, i) => i % 3 === 0).slice(0, 3);
  const [ai, setAi] = useState<string | null>(() => { try { return localStorage.getItem(tipKey(s.target, s.native, unit)); } catch { return null; } });
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const explain = async () => {
    setState("loading");
    try {
      const r = await fetch("/api/tip", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetName: langName(s.target, "en"), nativeName: langName(s.native, "en"), focus: info.focus, title: info.title, level: info.level, examples: examples.map((c) => `${c.tr[s.target]} = ${c.tr[s.native]}`) }),
      });
      const data = await r.json() as { ok?: boolean; text?: string };
      if (!r.ok || !data.text) throw new Error("tip_failed");
      setAi(data.text); setState("idle");
      try { localStorage.setItem(tipKey(s.target, s.native, unit), data.text); } catch { /* storage full */ }
    } catch { setState("error"); }
  };
  return (
    <Card className="relative space-y-3">
      <button aria-label={t("close")} onClick={onClose} className="absolute right-3 top-3 rounded-full p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
      <p className="text-xs font-extrabold uppercase text-muted-foreground">💡 {t("grammarTip")} · {info.level} · {t("unit")} {unit + 1}</p>
      <h3 className="pr-8 text-xl font-extrabold">{unitTitle(unit, s.native)}</h3>
      <p className="rounded-xl bg-muted p-3 text-sm font-bold">{info.focus}</p>
      <div className="space-y-2">
        {examples.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <button aria-label={t("listenBtn")} onClick={() => speak(c.tr[s.target], { lang: tg.locale, rate: s.rate })} className="rounded-lg bg-secondary p-1.5 text-secondary-foreground"><Volume2 className="h-4 w-4" /></button>
            <p className="text-sm"><b>{c.tr[s.target]}</b> — <span className="text-muted-foreground">{c.tr[s.native]}</span></p>
          </div>
        ))}
      </div>
      {ai ? <div className="whitespace-pre-line rounded-xl border-2 border-border p-3 text-sm leading-relaxed">{ai}</div>
        : <Btn variant="secondary" className="w-full" disabled={state === "loading"} onClick={() => void explain()}>{state === "loading" ? "…" : `✨ ${t("explainAi")}`}</Btn>}
      {state === "error" && <p className="text-xs font-bold text-destructive">{t("tipOffline")}</p>}
    </Card>
  );
}
