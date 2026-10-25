import { useEffect, useMemo, useState } from "react";
import { Check, Star, X, Sparkles, Volume2, Languages, PencilLine, Mic } from "lucide-react";
import { NODES_PER_UNIT, TARGETS, UNITS, nodeConcepts, unitConcepts, CONCEPTS, type Concept, type NativeLang, type TargetLang } from "@/lib/lingo/content";
import { compareSpeech, shuffle } from "@/lib/lingo/engine";
import { makeT, unitTitle, langName } from "@/lib/lingo/i18n";
import { speak, stopSpeaking } from "@/lib/voice";
import { levelFromXp, type Lingo } from "@/lib/lingo/store";
import { Btn, Card, SpeakButtons, MicButton, useSpeech, ScoreBar } from "./ui";
import { cn } from "@/lib/utils";

const UNIT_STYLE = ["bg-primary text-primary-foreground", "bg-secondary text-secondary-foreground", "bg-flame text-primary-foreground", "bg-heart text-primary-foreground", "bg-accent text-accent-foreground"];
const OFFSET = [0, 56, -56];
type ExerciseKind = "choose" | "listen" | "translate" | "fill" | "speak";
type Exercise = { id: string; kind: ExerciseKind; concept: Concept; prompt: string; answer: string; options: Concept[]; direction: "target" | "native" };

/** Ten varied, offline-capable exercises per lesson; no API call is needed for core practice. */
export function buildLessonExercises(unit: number, node: number, native: NativeLang, target: TargetLang): Exercise[] {
  const actualUnit = unit % UNITS.length;
  // Keep the authored concepts in curriculum order before spaced review begins.
  // The current bundled phrase bank has 45 concepts, so units beyond that authored
  // pool are explicitly practice/review rather than pretending to contain new phrases.
  const concepts = nodeConcepts(actualUnit, node % NODES_PER_UNIT);
  const pool = unitConcepts(actualUnit).length ? unitConcepts(actualUnit) : CONCEPTS;
  const kinds: ExerciseKind[] = ["choose", "listen", "translate", "fill", "choose", "speak", "listen", "translate", "fill", "choose"];
  return kinds.map((kind, i) => {
    const authoredIndex = unit * (NODES_PER_UNIT * CONCEPTS_PER_NODE) + node * CONCEPTS_PER_NODE + (i % CONCEPTS_PER_NODE);
    const concept = concepts[i % concepts.length] ?? CONCEPTS[authoredIndex % CONCEPTS.length]!;
    const source = concept.tr[native] || concept.tr.en;
    const targetText = concept.tr[target] || concept.tr.es;
    const direction: "target" | "native" = kind === "listen" || (kind === "choose" && i === 9) ? "native" : "target";
    const prompt = kind === "choose" ? `Challenge ${i + 1}: Choose the ${direction === "target" ? langName(target, "en") : langName(native, "en")} translation for “${direction === "target" ? source : targetText}”.`
      : kind === "listen" ? `Listening challenge ${i + 1}: Listen and choose the meaning of the spoken phrase.`
      : kind === "translate" ? `Translation challenge ${i + 1}: Translate “${source}” into ${langName(target, "en")}.`
      : kind === "fill" ? `Fill-in challenge ${i + 1}: Complete the ${langName(target, "en")} phrase: “${targetText.replace(/\b[\p{L}’'-]+/u, "_____ ").replace(/\s+/g, " ").trim()}”.`
      : `Speaking challenge ${i + 1}: Say this phrase in ${langName(target, "en")}.`;
    const answer = kind === "fill" ? (targetText.match(/^[\p{L}’'-]+/u)?.[0] || targetText) : direction === "target" ? targetText : source;
    const optionPool = shuffle(pool.filter((candidate) => candidate.id !== concept.id));
    const options = shuffle([concept, ...optionPool.slice(0, 3)]);
    return { id: `u${unit}-n${node}-q${i + 1}`, kind, concept, prompt, answer, options, direction };
  });
}

export function LearnPath({ lingo, reward, fail }: { lingo: Lingo; reward: (xp: number) => void; fail: () => void }) {
  const { s, done } = lingo;
  const visibleUnitCount = UNITS.length;
  const t = makeT(s.native);
  const [lesson, setLesson] = useState<number | null>(null);
  if (lesson !== null) return <Lesson lingo={lingo} node={lesson} reward={reward} onExit={() => setLesson(null)} />;
  return <div className="space-y-10 pb-10">
    {Array.from({ length: visibleUnitCount }, (_, ui) => {
      const unit = UNITS[ui % UNITS.length]!; const generated = ui >= 5;
      return <section key={ui}>
        <div className={cn("mb-6 rounded-3xl p-5", UNIT_STYLE[ui % UNIT_STYLE.length])}>
          <p className="text-xs font-extrabold uppercase opacity-80">{t("unit")} {ui + 1}{generated ? " · MIXED PRACTICE" : ""}</p>
          <h2 className="text-2xl font-extrabold">{<>{unit.emoji} {unitTitle(ui, s.native) || unit.title}</>}</h2>
          <p className="mt-1 text-sm font-bold opacity-80">{ui < 5 ? "Foundation content · 10 exercises per lesson" : "Progressive practice · new content bank required for fully unique phrases"} · no hearts · no locks</p>
        </div>
        <div className="flex flex-col items-center gap-5">
          {Array.from({ length: NODES_PER_UNIT }).map((_, ni) => {
            const idx = ui * NODES_PER_UNIT + ni; const isDone = done.includes(idx);
            return <div key={ni} style={{ transform: `translateX(${OFFSET[ni % OFFSET.length]}px)` }} className="relative">
              {!isDone && ni === 0 && <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-border bg-card px-3 py-1 text-xs font-extrabold text-primary">{t("start")}</div>}
              <button onClick={() => setLesson(idx)} aria-label={`${t("lesson")} ${idx + 1}${isDone ? ` — ${t("done")}` : ""}`} className={cn("btn-3d grid h-20 w-20 place-items-center rounded-full", isDone ? "bg-flame text-primary-foreground [--btn-shadow:color-mix(in_oklch,var(--flame)_70%,black)]" : "bg-primary text-primary-foreground ring-4 ring-accent")}>
                {isDone ? <Check className="h-9 w-9" strokeWidth={3} /> : <Star className="h-9 w-9 fill-current" />}
              </button>
            </div>;
          })}
        </div>
      </section>;
    })}
  </div>;
}

function Lesson({ lingo, node, reward, onExit }: { lingo: Lingo; node: number; reward: (xp: number) => void; onExit: () => void }) {
  const { s, completeNode } = lingo; const t = makeT(s.native);
  const targetInfo = TARGETS.find((x) => x.id === s.target)!;
  const unit = Math.floor(node / NODES_PER_UNIT); const nodeInUnit = node % NODES_PER_UNIT;
  const questions = useMemo(() => shuffle(buildLessonExercises(unit, nodeInUnit, s.native, s.target)), [s.native, s.target, unit, nodeInUnit]);
  const [qi, setQi] = useState(0); const [picked, setPicked] = useState<string | null>(null); const [typed, setTyped] = useState(""); const [score, setScore] = useState<number | null>(null); const [liveTranscript, setLiveTranscript] = useState("");
  const q = questions[qi]!; const speech = useSpeech(targetInfo.locale, s.native); const isTyped = q.kind === "translate" || q.kind === "fill";
  const optionText = (concept: Concept) => q.direction === "target" ? concept.tr[s.target] : concept.tr[s.native];
  useEffect(() => {
    if (q.kind === "listen") speak(q.concept.tr[s.target], { lang: targetInfo.locale, rate: s.rate });
    return () => stopSpeaking();
  }, [q.id, q.kind, q.concept, s.target, s.rate, targetInfo.locale]);

  const evaluate = (correct: boolean, answerScore = correct ? 100 : 0) => {
    setScore(answerScore); setPicked(correct ? q.concept.id : "__wrong__");
    if (correct) reward(5);
  };
  const choose = (id: string) => { if (picked) return; evaluate(id === q.concept.id); };
  const checkTyped = () => {
    if (!typed.trim() || picked) return;
    const result = compareSpeech(q.answer, typed, s.target);
    evaluate(result.score >= 80, result.score);
  };
  const checkSpoken = (transcript: string) => {
    const result = compareSpeech(q.answer, transcript, s.target);
    evaluate(result.score >= 80, result.score);
  };
  const next = () => {
    if (qi === questions.length - 1) { completeNode(node); reward(10); onExit(); return; }
    setQi((current) => current + 1); setPicked(null); setTyped(""); setScore(null); setLiveTranscript("");
  };
  return <div className="mx-auto max-w-xl space-y-5">
    <div className="flex items-center gap-3"><button aria-label={t("exit")} onClick={onExit}><X className="h-7 w-7 text-muted-foreground" /></button><div className="h-4 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((qi + (picked ? 1 : 0)) / questions.length) * 100}%` }} /></div><span className="text-xs font-extrabold">{qi + 1}/{questions.length}</span></div>
    <Card className="space-y-3">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-accent p-3 text-accent-foreground">{q.kind === "listen" ? <Volume2 /> : q.kind === "speak" ? <Mic /> : q.kind === "translate" ? <Languages /> : <PencilLine />}</span><div><p className="text-xs font-extrabold uppercase text-muted-foreground">{q.kind.toUpperCase()}</p><h2 className="text-xl font-extrabold">{q.prompt}</h2></div></div>
      {q.kind === "listen" && <p className="text-sm text-muted-foreground">Audio plays automatically. Replay if you need to hear it again.</p>}
      {q.kind === "speak" && <div className="space-y-2"><p className="text-2xl font-extrabold">{q.concept.tr[s.target]}</p><SpeakButtons text={q.answer} locale={targetInfo.locale} rate={s.rate} native={s.native} /></div>}
      {q.kind === "fill" && <p className="rounded-xl bg-muted p-3 font-bold">{q.concept.tr[s.target].replace(/\b[\p{L}’'-]+/u, "_____ ").replace(/\s+/g, " ").trim()}</p>}
    </Card>
    {(q.kind === "translate" || q.kind === "fill") && <div className="flex gap-2"><input value={typed} onChange={(event) => setTyped(event.target.value)} onKeyDown={(event) => event.key === "Enter" && checkTyped()} disabled={!!picked} placeholder={q.kind === "fill" ? "Complete the phrase…" : `Translate into ${langName(s.target, s.native)}…`} className="min-w-0 flex-1 rounded-2xl border-2 border-border bg-card p-4 font-bold outline-none focus:border-primary" /><Btn onClick={checkTyped} disabled={!typed.trim() || !!picked}>Check</Btn></div>}
    {q.kind === "speak" && <div className="flex flex-col items-center gap-2"><MicButton big listening={speech.listening} disabled={!speech.supported || !!picked || speech.processing} onClick={() => speech.listening ? speech.stop() : (setLiveTranscript(""), speech.listen(checkSpoken, setLiveTranscript, false))} />{speech.listening && <p aria-live="polite" className="min-h-6 text-center text-sm font-semibold text-primary">{liveTranscript || "Listening… start speaking"}</p>}{speech.error && <p className="text-xs text-destructive">{speech.error}</p>}{speech.processing && <p role="status" className="text-xs text-primary">Transcribing your recording…</p>}<p className="text-xs text-muted-foreground">{speech.supported ? "Speak the phrase; the recognized words will be checked." : "Speech recognition is not available. Type your answer below."}</p>{!speech.supported && <div className="flex w-full gap-2"><input value={typed} onChange={(event) => setTyped(event.target.value)} placeholder="Type what you said" className="min-w-0 flex-1 rounded-xl border-2 border-border bg-card p-3" /><Btn onClick={() => { const r = compareSpeech(q.answer, typed, s.target); evaluate(r.score >= 80, r.score); }}>Check</Btn></div>}</div>}
    {(q.kind === "choose" || q.kind === "listen") && <div className="grid gap-3">{q.options.map((option) => <button key={option.id} disabled={!!picked || q.kind === "speak"} onClick={() => choose(option.id)} className={cn("rounded-2xl border-2 border-b-4 p-4 text-left text-lg font-bold transition", !picked && "border-border hover:bg-muted", picked && option.id === q.concept.id && "border-success bg-success-soft", picked === option.id && option.id !== q.concept.id && "border-destructive bg-danger-soft", picked && option.id !== q.concept.id && "opacity-60")}>{optionText(option)}</button>)}</div>}
    {picked && <div className={cn("space-y-3 rounded-2xl p-4", picked === q.concept.id ? "bg-success-soft" : "bg-danger-soft")}><p className="font-extrabold">{picked === q.concept.id ? "Correct! Nice work." : `Not quite. Correct answer: ${q.answer}`}</p>{score !== null && <ScoreBar label="Response match" value={score} />}<div className="flex gap-2">{picked !== q.concept.id && <Btn variant="ghost" className="flex-1" onClick={() => { setPicked(null); setScore(null); setTyped(""); }}>Try again</Btn>}<Btn className="flex-1" onClick={next}>{qi === questions.length - 1 ? t("finish") : t("cont")}</Btn></div></div>}
  </div>;
}
