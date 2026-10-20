import { useEffect, useState } from "react";
import { Flame, Eye, EyeOff, Volume2 } from "lucide-react";
import { CONCEPTS, TARGETS, type Concept } from "@/lib/lingo/content";
import { shuffle } from "@/lib/lingo/engine";
import { makeT } from "@/lib/lingo/i18n";
import type { Lingo } from "@/lib/lingo/store";
import { speak, stopSpeaking, unlockAudio } from "@/lib/lingo/audio";
import { Btn, Card, SpeakButtons } from "./ui";
import { cn } from "@/lib/utils";

export const FIRE_COMBO_LEVELS = [
  { level: 1, name: "Warm-up", count: 10, rate: 0.8 },
  { level: 2, name: "Getting faster", count: 10, rate: 0.9 },
  { level: 3, name: "Everyday speech", count: 12, rate: 1 },
  { level: 4, name: "Longer phrases", count: 12, rate: 1 },
  { level: 5, name: "Natural pace", count: 15, rate: 1.05 },
  { level: 6, name: "Fluent response", count: 15, rate: 1.1 },
  { level: 7, name: "Master challenge", count: 15, rate: 1.1 },
];
type Question = { concept: Concept; options: Concept[] };

export function FireCombo({ lingo, reward }: { lingo: Lingo; reward: (xp: number) => void }) {
  const { s } = lingo; const t = makeT(s.native); const target = TARGETS.find((x) => x.id === s.target)!;
  const [level, setLevel] = useState(1); const [playing, setPlaying] = useState(false); const [index, setIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]); const [selected, setSelected] = useState<string | null>(null); const [reveal, setReveal] = useState(false); const [earned, setEarned] = useState(0);
  const config = FIRE_COMBO_LEVELS[level - 1]!; const q = questions[index];
  const makeQuestions = (chosen: number) => {
    const cfg = FIRE_COMBO_LEVELS[chosen - 1]!; const deck = shuffle(CONCEPTS);
    return Array.from({ length: cfg.count }, (_, i) => {
      const concept = deck[i % deck.length]!;
      const options = shuffle([concept, ...shuffle(CONCEPTS.filter((c) => c.id !== concept.id)).slice(0, 3)]);
      return { concept, options };
    });
  };
  const start = (chosen = level) => {
    void unlockAudio(); stopSpeaking(); setLevel(chosen); setQuestions(makeQuestions(chosen)); setIndex(0); setSelected(null); setReveal(false); setEarned(0); setPlaying(true);
  };
  useEffect(() => {
    if (playing && q) speak(q.concept.tr[s.target], target.locale, Math.min(1.15, s.rate * config.rate));
    return () => stopSpeaking();
    // q changes each turn; playback intentionally starts when the question appears.
  }, [playing, index, questions]); // eslint-disable-line react-hooks/exhaustive-deps
  const answer = (id: string) => {
    if (selected || !q) return;
    setSelected(id);
    if (id === q.concept.id) setEarned((n) => n + 5);
  };
  const next = () => {
    if (index + 1 >= questions.length) {
      const total = earned;
      reward(total); setEarned(total); setPlaying(false); stopSpeaking(); return;
    }
    setIndex((n) => n + 1); setSelected(null); setReveal(false);
  };
  if (!playing) return <Card className="space-y-4 text-center">
    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-flame text-white"><Flame className="h-9 w-9" /></div>
    <h2 className="text-3xl font-extrabold">Fire Combo</h2>
    {earned > 0 && <p className="font-extrabold text-primary">Last run: +{earned} XP</p>}
    <p className="text-muted-foreground">Listen to Chloe's prompt, choose the meaning, and build a streak. Text stays hidden by default. Unlimited retries, no timer.</p>
    <div className="grid gap-2 sm:grid-cols-2">{FIRE_COMBO_LEVELS.map((item) => <button key={item.level} onClick={() => setLevel(item.level)} className={cn("rounded-2xl border-2 p-3 text-left", level === item.level ? "border-primary bg-accent text-accent-foreground" : "border-border")}><b>Level {item.level} · {item.name}</b><span className="block text-xs opacity-70">{item.count} prompts</span></button>)}</div>
    <Btn className="w-full" onClick={() => start(level)}>Start Fire Combo</Btn>
  </Card>;
  if (!q) return null;
  return <div className="mx-auto max-w-xl space-y-4">
    <div className="flex items-center justify-between"><span className="font-extrabold"><Flame className="mr-1 inline h-5 w-5 text-flame" />Level {level} · {config.name}</span><span className="text-sm font-bold">{index + 1}/{questions.length}</span></div>
    <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full bg-flame transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
    <Card className="space-y-4 text-center"><p className="text-xs font-extrabold uppercase text-muted-foreground">Listen and choose the meaning</p><div className="flex items-center justify-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-secondary-foreground"><Volume2 className="h-7 w-7" /></span><SpeakButtons text={q.concept.tr[s.target]} locale={target.locale} rate={Math.min(1.15, s.rate * config.rate)} native={s.native} /></div>
      {reveal ? <p className="text-2xl font-extrabold">{q.concept.tr[s.target]}</p> : <p className="text-2xl font-extrabold tracking-[0.35em] text-muted-foreground">••••••</p>}
      <button onClick={() => setReveal((v) => !v)} className="mx-auto flex items-center gap-1 text-xs font-bold text-muted-foreground">{reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{reveal ? "Hide phrase" : "Reveal phrase"}</button>
    </Card>
    <div className="grid gap-3">{q.options.map((option) => <button key={option.id} disabled={!!selected} onClick={() => answer(option.id)} className={cn("rounded-2xl border-2 border-b-4 border-border bg-card p-4 text-left text-lg font-bold", selected && option.id === q.concept.id && "border-primary bg-success-soft", selected === option.id && option.id !== q.concept.id && "border-destructive bg-danger-soft")}>{option.tr[s.native]}</button>)}</div>
    {selected && <div className={cn("rounded-2xl p-4", selected === q.concept.id ? "bg-success-soft" : "bg-danger-soft")}><p className="mb-3 font-extrabold">{selected === q.concept.id ? "Correct! +5 XP" : `Not quite. Correct answer: ${q.concept.tr[s.native]}`}</p><div className="flex gap-2">{selected !== q.concept.id && <Btn variant="ghost" className="flex-1" onClick={() => setSelected(null)}>Try again</Btn>}<Btn className="flex-1" onClick={next}>{index + 1 === questions.length ? "Finish level" : "Next prompt"}</Btn></div></div>}
    <p className="text-center text-xs text-muted-foreground">No timer · Unlimited retries · {earned} XP earned</p>
  </div>;
}
