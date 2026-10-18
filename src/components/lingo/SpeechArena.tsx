import { useEffect, useRef, useState } from "react";
import { RefreshCw, SkipForward, Timer, Zap, Eye, EyeOff, Volume2 } from "lucide-react";
import { CONCEPTS, TARGETS, type Concept } from "@/lib/lingo/content";
import { compareSpeech, makeDeck, shuffle, type SpeechCompare } from "@/lib/lingo/engine";
import { langName, makeT } from "@/lib/lingo/i18n";
import type { Lingo } from "@/lib/lingo/store";
import { sfx, speak, stopSpeaking } from "@/lib/lingo/audio";
import { Btn, Card, MicButton, SpeakButtons, useSpeech } from "./ui";
import { cn } from "@/lib/utils";

export function SpeechArena(props: { lingo: Lingo; reward: (xp: number) => void; fail: () => void }) {
  const t = makeT(props.lingo.s.native);
  const [mode, setMode] = useState<"duel" | "rapid">("duel");
  useEffect(() => () => stopSpeaking(), []);
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
        {(["duel", "rapid"] as const).map((m) => (
          <button key={m} onClick={() => { stopSpeaking(); setMode(m); }} className={cn("rounded-xl py-2 text-sm font-extrabold uppercase transition", mode === m ? "bg-card shadow" : "text-muted-foreground")}>
            {m === "duel" ? `🎙️ ${t("pronDuel")}` : `⚡ ${t("rapid")}`}
          </button>
        ))}
      </div>
      {mode === "duel" ? <Duel {...props} /> : <Rapid {...props} />}
    </div>
  );
}

function Duel({ lingo, reward }: { lingo: Lingo; reward: (xp: number) => void }) {
  const { s, update } = lingo;
  const t = makeT(s.native);
  const tg = TARGETS.find((x) => x.id === s.target)!;
  const deck = useRef(makeDeck(CONCEPTS)).current; // no repeats until every phrase was used
  const [c, setC] = useState<Concept>(() => deck());
  const [spoken, setSpoken] = useState("");
  const [typed, setTyped] = useState("");
  const [res, setRes] = useState<SpeechCompare | null>(null);
  const rewarded = useRef(false);
  const speech = useSpeech(tg.locale, s.native);
  const target = c.tr[s.target];
  const correct = res?.score === 100;

  const evaluate = (text: string) => {
    const r = compareSpeech(target, text, s.target);
    setSpoken(text); setRes(r);
    if (r.score === 100) {
      sfx.correct();
      if (!rewarded.current) { rewarded.current = true; reward(10); }
    } else sfx.wrong();
    if (r.score > s.bestPron) update({ bestPron: r.score });
  };
  const go = () => { setRes(null); setSpoken(""); speech.listen(evaluate, setSpoken); };
  const next = () => {
    speech.stop(); stopSpeaking();
    setC(deck()); setSpoken(""); setTyped(""); setRes(null); rewarded.current = false;
  };

  return (
    <div className="space-y-5">
      <Card className="text-center">
        <p className="text-xs font-extrabold uppercase text-muted-foreground">{t("sayIn", { lang: langName(s.target, s.native) })}</p>
        <div className="my-4 flex flex-wrap justify-center gap-1.5 text-3xl font-extrabold">
          {res && !speech.listening ? res.words.map((w, k) => (
            <span key={k} className={cn("rounded-lg px-1.5 transition", w.ok ? "bg-success-soft text-success" : "bg-danger-soft text-destructive")}>{w.w}</span>
          )) : <span>{target}</span>}
        </div>
        <p className="mb-4 text-muted-foreground">“{c.tr[s.native]}”</p>
        <div className="flex justify-center"><SpeakButtons text={target} locale={tg.locale} rate={s.rate} native={s.native} /></div>
      </Card>

      <div className="flex flex-col items-center gap-3">
        <MicButton big listening={speech.listening} disabled={!speech.supported} onClick={() => (speech.listening ? speech.stop() : go())} />
        <p className="text-sm font-bold text-muted-foreground">{speech.listening ? t("listening") : speech.supported ? t("tapSpeak") : t("noVoice")}</p>
        {spoken && <p className="text-sm">{t("youSaid")}: <b>{spoken}</b></p>}
        {speech.error && <p className="text-center text-sm font-bold text-destructive">{speech.error}</p>}
      </div>

      {(!speech.supported || speech.error) && (
        <div className="flex gap-2">
          <input value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === "Enter" && typed.trim() && evaluate(typed)} placeholder={t("typeWhatSay")}
            className="flex-1 rounded-2xl border-2 border-border bg-card p-3 font-bold outline-none focus:border-primary" />
          <Btn variant="secondary" onClick={() => typed.trim() && evaluate(typed)}>{t("check")}</Btn>
        </div>
      )}

      {res && !speech.listening && (
        <div className={cn("space-y-3 rounded-3xl p-5 animate-in slide-in-from-bottom-4", correct ? "bg-success-soft animate-pop" : "bg-danger-soft")}>
          <p className="text-2xl font-extrabold">{correct ? t("good") : t("bad")}</p>
          <p className="font-bold">{res.score}% {t("accuracy")}{correct && " · +10 XP"}</p>
          {!correct && <Btn className="w-full" onClick={go} disabled={!speech.supported}><RefreshCw className="mr-2 inline h-4 w-4" />{t("iterate")}</Btn>}
        </div>
      )}

      {/* Always visible: advance to the next phrase */}
      <Btn variant={correct ? "primary" : "ghost"} className="w-full" onClick={next}><SkipForward className="mr-2 inline h-4 w-4" />{t("next")}</Btn>
    </div>
  );
}

type RQ = { c: Concept; opts: Concept[] };

function Rapid({ lingo, reward }: { lingo: Lingo; reward: (xp: number) => void; fail: () => void }) {
  const { s, update } = lingo;
  const t = makeT(s.native);
  const tg = TARGETS.find((x) => x.id === s.target)!;
  const [state, setState] = useState<"idle" | "play" | "over">("idle");
  const [time, setTime] = useState(45);
  const [qs, setQs] = useState<RQ[]>([]);
  const [qi, setQi] = useState(0);
  const [combo, setCombo] = useState(1);
  const [earned, setEarned] = useState(0);
  const [flash, setFlash] = useState("");
  const [reveal, setReveal] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    const picks = shuffle(CONCEPTS).slice(0, 5);
    setQs(picks.map((c) => {
      const seen = new Set([c.tr[s.native]]);
      const opts: Concept[] = [];
      for (const x of shuffle(CONCEPTS)) {
        if (x.id === c.id || seen.has(x.tr[s.native])) continue;
        seen.add(x.tr[s.native]); opts.push(x);
        if (opts.length === 2) break;
      }
      return { c, opts: shuffle([c, ...opts]) };
    }));
    setQi(0); setCombo(1); setEarned(0); setTime(45); setReveal(false); setState("play");
  };

  // The bot DICTATES the question: nothing about the phrase is printed unless the learner asks for it.
  useEffect(() => {
    if (state !== "play" || !qs[qi]) return;
    setReveal(false);
    speak(qs[qi]!.c.tr[s.target], tg.locale, s.rate);
  }, [state, qi, qs]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    if (state !== "play") return;
    timer.current = setInterval(() => setTime((x) => x - 1), 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [state]);
  useEffect(() => { if (state === "play" && time <= 0) finish(earned); }, [time]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = (total: number) => {
    stopSpeaking(); setState("over");
    if (total > 0) reward(total);
    if (total > s.rapidBest) update({ rapidBest: total });
  };
  const answer = (id: string) => {
    const q = qs[qi]!;
    const right = id === q.c.id;
    let total = earned;
    if (right) {
      const gain = reveal ? 2 : 5 * combo; total += gain; setEarned(total);
      setTime((x) => x + 3); setCombo((c) => Math.min(3, c + 1)); setFlash("animate-pop"); sfx.correct();
    } else { setCombo(1); setFlash("animate-shake"); sfx.wrong(); }
    setTimeout(() => setFlash(""), 450);
    if (qi === qs.length - 1) finish(total); else setQi(qi + 1);
  };

  if (state === "idle" || state === "over") return (
    <Card className="space-y-4 text-center">
      <div className="text-6xl">🎧</div>
      <h2 className="text-3xl font-extrabold">{state === "over" ? `+${earned} XP!` : t("rapidTitle")}</h2>
      <p className="text-muted-foreground">{state === "over" ? `${t("best")}: ${Math.max(s.rapidBest, earned)} XP` : t("rapidDesc")}</p>
      <Btn variant="warn" className="w-full" onClick={start}><Zap className="mr-2 inline h-4 w-4" />{state === "over" ? t("playAgain") : t("start")}</Btn>
    </Card>
  );

  const q = qs[qi]!;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={cn("flex items-center gap-1 text-2xl font-extrabold", time <= 10 && "text-destructive animate-pulse")}><Timer className="h-6 w-6" />{time}s</span>
        <span className="rounded-full bg-flame px-3 py-1 font-extrabold text-primary-foreground">{combo}× combo</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full bg-flame transition-all" style={{ width: `${Math.min(100, (time / 45) * 100)}%` }} /></div>
      <Card className={cn("space-y-3 text-center", flash)}>
        <p className="text-xs font-extrabold uppercase text-muted-foreground">Q{qi + 1}/{qs.length} · {t("listenPick")}</p>
        <div className="flex items-center justify-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-secondary-foreground"><Volume2 className="h-7 w-7" /></span>
          <SpeakButtons text={q.c.tr[s.target]} locale={tg.locale} rate={s.rate} native={s.native} />
        </div>
        {reveal
          ? <p className="text-2xl font-extrabold">{q.c.tr[s.target]}</p>
          : <p className="text-2xl font-extrabold tracking-widest text-muted-foreground">• • •</p>}
        <button onClick={() => setReveal((r) => !r)} className="mx-auto flex items-center gap-1 text-xs font-bold text-muted-foreground">
          {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{reveal ? t("hideText") : t("showText")}
        </button>
      </Card>
      <div className="grid gap-3">
        {q.opts.map((o) => <button key={o.id} onClick={() => answer(o.id)} className="rounded-2xl border-2 border-b-4 border-border bg-card p-4 text-lg font-bold transition hover:bg-muted active:translate-y-1">{o.tr[s.native]}</button>)}
      </div>
      <p className="text-center text-xs text-muted-foreground">{t("earned")}: {earned} XP</p>
    </div>
  );
}
