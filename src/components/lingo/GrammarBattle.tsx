import { useEffect, useRef, useState } from "react";
import { Send, Swords, RefreshCw, Lightbulb, Eye, EyeOff } from "lucide-react";
import { CONCEPTS, PERSONAS, TARGETS, type Concept } from "@/lib/lingo/content";
import { dictationCheck, makeDeck, type DictationResult } from "@/lib/lingo/engine";
import { langName, makeT, type K } from "@/lib/lingo/i18n";
import type { Lingo } from "@/lib/lingo/store";
import { sfx, speak, stopSpeaking } from "@/lib/lingo/audio";
import { Btn, Card, MicButton, ScoreBar, SpeakButtons, useSpeech } from "./ui";
import { cn } from "@/lib/utils";

/**
 * Listening mode: the bot DICTATES a sentence in the target language. The text is hidden by
 * default; the learner listens and writes (or says) what they heard. Showing the text is an
 * explicit, XP-reduced accessibility fallback.
 */
export function GrammarBattle({ lingo, reward, fail }: { lingo: Lingo; reward: (xp: number) => void; fail: () => void }) {
  const { s, update } = lingo;
  const t = makeT(s.native);
  const tg = TARGETS.find((x) => x.id === s.target)!;
  const persona = PERSONAS.find((p) => p.id === s.persona)!;
  const deck = useRef(makeDeck(CONCEPTS)).current; // never repeats a sentence until all were used
  const [ci, setCi] = useState(0);
  const [c, setC] = useState<Concept>(() => deck());
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<DictationResult | null>(null);
  const [done, setDone] = useState<"win" | "lose" | null>(null);
  const [anim, setAnim] = useState("");
  const [reveal, setReveal] = useState(false);
  const speech = useSpeech(tg.locale, s.native);
  const target = c.tr[s.target];

  // The bot reads the request aloud at the start of every round.
  useEffect(() => { speak(target, tg.locale, s.rate); return () => stopSpeaking(); }, [c.id, s.target]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    if (!input.trim() || done) return;
    const r = dictationCheck(target, input, s.target);
    setResult(r);
    if (r.exact) {
      const xp = reveal ? 5 : attempts === 0 ? 15 : 20;
      setDone("win"); setAnim("animate-pop"); sfx.correct(); reward(xp); update({ grammarWins: s.grammarWins + 1 });
    } else {
      setAttempts((n) => n + 1); setAnim("animate-shake"); fail();
    }
    setTimeout(() => setAnim(""), 500);
  };
  const next = () => {
    setCi(ci + 1); setC(deck()); setInput(""); setAttempts(0); setResult(null); setDone(null); setReveal(false);
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center gap-2 text-muted-foreground"><Swords className="h-5 w-5" /><span className="text-sm font-extrabold uppercase">{t("grammarTitle")} · {t("round")} {ci + 1}</span></div>
      <Card className="space-y-3">
        <div className="flex gap-4">
          <div className={cn("text-5xl", !done && "animate-pulse")}>{persona.emoji}</div>
          <div className="flex-1">
            <p className="text-xs font-extrabold uppercase text-muted-foreground">{t(`p_${persona.id}` as K)}</p>
            <p className="text-lg font-extrabold">{t("listenWrite")}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <SpeakButtons text={target} locale={tg.locale} rate={s.rate} native={s.native} />
          <button onClick={() => setReveal((r) => !r)} disabled={!!done} className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{reveal ? t("hideText") : t("showText")}
          </button>
        </div>
        {reveal && !done && <p className="rounded-2xl bg-muted p-3 text-lg font-extrabold">{target}</p>}
      </Card>

      <div className={cn("space-y-3", anim)}>
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} disabled={!!done}
            placeholder={t("typeIn", { lang: langName(s.target, s.native) })} className="flex-1 rounded-2xl border-2 border-border bg-card p-4 text-lg font-bold outline-none focus:border-primary" />
          {speech.supported && <MicButton listening={speech.listening} disabled={!!done} onClick={() => (speech.listening ? speech.stop() : speech.listen(setInput, setInput))} />}
        </div>
        {speech.error && <p className="text-sm font-bold text-destructive">{speech.error}</p>}
        {!speech.supported && <p className="text-xs text-muted-foreground">{t("noVoice")}</p>}
        {!done && <Btn className="w-full" onClick={submit} disabled={!input.trim()}><Send className="mr-2 inline h-4 w-4" />{attempts ? t("resubmit") : t("submit")}</Btn>}
      </div>

      {result && !result.exact && !done && (
        <div className="space-y-2 rounded-3xl border-2 border-flame bg-warn p-5 text-warn-foreground animate-in slide-in-from-bottom-4">
          <p className="flex items-start gap-2 font-extrabold"><Lightbulb className="mt-0.5 h-5 w-5 shrink-0" />
            {[result.missing.length ? `${t("missing")}: ${result.missing.slice(0, 3).join(" ")}` : "", result.extra.length ? `${t("extra")}: ${result.extra.slice(0, 3).join(" ")}` : ""].filter(Boolean).join(" · ")}
          </p>
          <p className="text-sm font-bold">🔁 {t("retry")}</p>
        </div>
      )}

      {result && <Card><ScoreBar label={t("accuracy")} value={result.score} /></Card>}

      {done && (
        <div className={cn("space-y-3 rounded-3xl p-5 animate-in slide-in-from-bottom-4", done === "win" ? "bg-success-soft" : "bg-danger-soft")}>
          <p className="text-xl font-extrabold">{done === "win" ? (attempts ? t("corrected") : t("flawless")) : ""}</p>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase opacity-70">{t("model")}</p>
              <p className="text-lg font-extrabold">{target}</p>
              <p className="text-sm opacity-80">{c.tr[s.native]}</p>
            </div>
            <SpeakButtons text={target} locale={tg.locale} rate={s.rate} native={s.native} />
          </div>
          <Btn onClick={next} className="w-full"><RefreshCw className="mr-2 inline h-4 w-4" />{t("nextRound")}</Btn>
        </div>
      )}
    </div>
  );
}
