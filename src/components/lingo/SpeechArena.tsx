import { useEffect, useRef, useState } from "react";
import { RefreshCw, SkipForward, Zap, Eye, EyeOff, Volume2, Trophy } from "lucide-react";
import { CONCEPTS, TARGETS, type Concept } from "@/lib/lingo/content";
import { compareSpeech, makeDeck, shuffle, type SpeechCompare } from "@/lib/lingo/engine";
import { langName, makeT } from "@/lib/lingo/i18n";
import type { Lingo } from "@/lib/lingo/store";
import { sfx, speak, stopSpeaking } from "@/lib/voice";
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
  const correct = !!res?.exact;

  // Speak the model phrase when a new duel begins; SpeakButtons provides replay and slow replay.
  useEffect(() => {
    speak(target, { lang: tg.locale, rate: s.rate });
    return () => stopSpeaking();
  }, [c.id, s.target]); // eslint-disable-line react-hooks/exhaustive-deps

  const evaluate = (text: string) => {
    const r = compareSpeech(target, text, s.target);
    setSpoken(text); setRes(r);
    if (r.exact) {
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
          {!correct && <Btn className="w-full" onClick={() => (speech.supported ? go() : typed.trim() && evaluate(typed))} disabled={!speech.supported && !typed.trim()}><RefreshCw className="mr-2 inline h-4 w-4" />{t("iterate")}</Btn>}
        </div>
      )}

      {/* Always visible: advance to the next phrase */}
      <Btn variant={correct ? "primary" : "ghost"} className="w-full" onClick={next}><SkipForward className="mr-2 inline h-4 w-4" />{t("next")}</Btn>
    </div>
  );
}

type RQ = { c: Concept; opts: Concept[] };

export const TURBO_LEVELS = [
  { level: 1, title: "Words & basics", description: "Words and short expressions", questions: 10, rate: 0.8 },
  { level: 2, title: "Short phrases", description: "Simple everyday phrases", questions: 10, rate: 0.85 },
  { level: 3, title: "Everyday sentences", description: "Common questions and answers", questions: 12, rate: 0.9 },
  { level: 4, title: "Longer sentences", description: "Longer sentences and connected speech", questions: 12, rate: 0.95 },
  { level: 5, title: "Natural expressions", description: "Idioms and natural language", questions: 14, rate: 1 },
  { level: 6, title: "Spontaneous speaking", description: "Understand and respond naturally", questions: 10, rate: 1.05 },
  { level: 7, title: "Advanced challenge", description: "Complex expressions and precision", questions: 12, rate: 1.1 },
];

function Rapid({ lingo, reward }: { lingo: Lingo; reward: (xp: number) => void; fail: () => void }) {
  const { s, update } = lingo;
  const t = makeT(s.native);
  const tg = TARGETS.find((x) => x.id === s.target)!;
  const [state, setState] = useState<"idle" | "play" | "over">("idle");
  const [level, setLevel] = useState(1);
  const [qs, setQs] = useState<RQ[]>([]);
  const [qi, setQi] = useState(0);
  const [combo, setCombo] = useState(1);
  const [earned, setEarned] = useState(0);
  const [flash, setFlash] = useState("");
  const [reveal, setReveal] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const start = (selectedLevel = level) => {
    const config = TURBO_LEVELS[selectedLevel - 1]!;
    const shuffled = shuffle(CONCEPTS);
    const picks = Array.from({ length: config.questions }, (_, i) => shuffled[i % shuffled.length]!);
    const usedConceptIds = new Set<string>();
    setQs(picks.map((original, i) => {
      let c = original;
      // Higher levels prioritize longer expressions while preserving unique prompts in a run.
      if (selectedLevel >= 4 && i % 2 === 0) {
        const longOnes = shuffled.filter((x) => x.tr[s.target].split(/\s+/).length >= 4 && !usedConceptIds.has(x.id));
        if (longOnes.length) c = longOnes[0]!;
      }
      if (usedConceptIds.has(c.id)) c = shuffled.find((candidate) => !usedConceptIds.has(candidate.id)) ?? original;
      usedConceptIds.add(c.id);
      const seen = new Set([c.tr[s.native]]);
      const opts: Concept[] = [];
      const candidates = shuffle(CONCEPTS.filter((x) => x.id !== c.id));
      for (const x of candidates) {
        if (seen.has(x.tr[s.native])) continue;
        seen.add(x.tr[s.native]); opts.push(x);
        if (opts.length === 2) break;
      }
      return { c, opts: shuffle([c, ...opts]) };
    }));
    setLevel(selectedLevel); setQi(0); setCombo(1); setEarned(0); setReveal(false); setLastCorrect(null); setState("play");
  };

  useEffect(() => {
    if (state !== "play" || !qs[qi]) return;
    setReveal(false);
    setLastCorrect(null);
    const config = TURBO_LEVELS[level - 1]!;
    speak(qs[qi]!.c.tr[s.target], { lang: tg.locale, rate: Math.min(1.15, s.rate * config.rate) });
  }, [state, qi, qs]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopSpeaking(), []);

  const finish = (total: number) => {
    stopSpeaking(); setState("over");
    if (total > 0) reward(total);
    if (total > s.rapidBest) update({ rapidBest: total });
  };
  const answer = (id: string) => {
    if (lastCorrect !== null) return;
    const q = qs[qi]!;
    const right = id === q.c.id;
    setLastCorrect(right);
    if (right) {
      const gain = reveal ? 2 : 5 * combo;
      setEarned((total) => total + gain);
      setCombo((currentCombo) => Math.min(5, currentCombo + 1)); setFlash("animate-pop"); sfx.correct();
    } else { setCombo(1); setFlash("animate-shake"); sfx.wrong(); }
    setTimeout(() => setFlash(""), 450);
  };
  const advance = () => {
    if (qi === qs.length - 1) finish(earned);
    else setQi((current) => current + 1);
  };

  if (state === "idle" || state === "over") return (
    <Card className="space-y-4 text-center">
      <div className="text-6xl">🎧</div>
      <h2 className="text-3xl font-extrabold">{state === "over" ? `+${earned} XP!` : "Arena Turbo"}</h2>
      <p className="text-muted-foreground">{state === "over" ? `${t("best")}: ${Math.max(s.rapidBest, earned)} XP · Level ${level}` : "Elige un nivel y practica a tu ritmo. Sin cronómetro, vidas ni límite de intentos."}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {TURBO_LEVELS.map((x) => <button key={x.level} onClick={() => setLevel(x.level)} className={cn("rounded-2xl border-2 p-3 text-left transition", level === x.level ? "border-primary bg-accent text-accent-foreground" : "border-border hover:bg-muted")}>
          <span className="block font-extrabold">Level {x.level} · {x.title}</span><span className="text-xs opacity-75">{x.description}</span>
        </button>)}
      </div>
      <Btn variant="warn" className="w-full" onClick={() => start(level)}><Zap className="mr-2 inline h-4 w-4" />{state === "over" ? "Replay level" : "Start level"}</Btn>
    </Card>
  );

  const q = qs[qi]!;
  const config = TURBO_LEVELS[level - 1]!;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-extrabold"><Trophy className="h-5 w-5 text-flame" /> Level {level}: {config.title}</span>
        <span className="rounded-full bg-flame px-3 py-1 font-extrabold text-primary-foreground">{combo}× combo</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${(qi / qs.length) * 100}%` }} /></div>
      <Card className={cn("space-y-3 text-center", flash)}>
        <p className="text-xs font-extrabold uppercase text-muted-foreground">Question {qi + 1}/{qs.length} · {config.description}</p>
        <div className="flex items-center justify-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-secondary-foreground"><Volume2 className="h-7 w-7" /></span>
          <SpeakButtons text={q.c.tr[s.target]} locale={tg.locale} rate={Math.min(1.15, s.rate * config.rate)} native={s.native} />
        </div>
        {reveal ? <p className="text-2xl font-extrabold">{q.c.tr[s.target]}</p> : <p className="text-2xl font-extrabold tracking-widest text-muted-foreground">• • •</p>}
        <button onClick={() => setReveal((r) => !r)} className="mx-auto flex items-center gap-1 text-xs font-bold text-muted-foreground">
          {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{reveal ? t("hideText") : t("showText")}
        </button>
      </Card>
      <div className="grid gap-3">
        {q.opts.map((o) => <button key={o.id} onClick={() => answer(o.id)} disabled={lastCorrect !== null} className={cn("rounded-2xl border-2 border-b-4 border-border bg-card p-4 text-lg font-bold transition hover:bg-muted active:translate-y-1 disabled:opacity-80", lastCorrect !== null && o.id === q.c.id && "border-primary bg-success-soft", lastCorrect === false && o.id !== q.c.id && "border-destructive bg-danger-soft")}>{o.tr[s.native]}</button>)}
      </div>
      {lastCorrect !== null && <div className={cn("space-y-3 rounded-2xl p-4", lastCorrect ? "bg-success-soft" : "bg-danger-soft")}><p className="font-extrabold">{lastCorrect ? "Correct! Nice combo." : `Not quite. The phrase means: ${q.c.tr[s.native]}. Try again or continue.`}</p><div className="flex gap-2">{!lastCorrect && <Btn variant="ghost" className="flex-1" onClick={() => setLastCorrect(null)}>Try again</Btn>}<Btn className="flex-1" onClick={advance}>{qi === qs.length - 1 ? "Finish level" : "Next question"}</Btn></div></div>}
      <p className="text-center text-xs text-muted-foreground">{t("earned")}: {earned} XP · Sin límite de tiempo</p>
    </div>
  );
}
