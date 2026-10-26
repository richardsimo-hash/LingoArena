import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Star, X, Volume2, Languages, PencilLine, Mic, RotateCcw } from "lucide-react";
import { CEFR_LEVELS, NODES_PER_UNIT, TARGETS, UNITS, nodeConcepts, unitConcepts, CONCEPTS, type Cefr, type Concept, type NativeLang, type TargetLang } from "@/lib/lingo/content";
import { compareSpeech, shuffle } from "@/lib/lingo/engine";
import { makeT, unitTitle, langName } from "@/lib/lingo/i18n";
import { speak, stopSpeaking } from "@/lib/voice";
import type { Lingo } from "@/lib/lingo/store";
import { INTERVALS, LESSONS_PER_REVIEW, dayNumber, deckStats, pickReview, type Deck } from "@/lib/lingo/srs";
import { Btn, Card, SpeakButtons, MicButton, useSpeech, ScoreBar } from "./ui";
import { PlacementTest } from "./PlacementTest";
import { cn } from "@/lib/utils";

const UNIT_STYLE = ["bg-primary text-primary-foreground", "bg-secondary text-secondary-foreground", "bg-flame text-primary-foreground", "bg-heart text-primary-foreground", "bg-accent text-accent-foreground"];
const OFFSET = [0, 56, -56];
type ExerciseKind = "choose" | "listen" | "translate" | "fill" | "speak";
type Exercise = { id: string; kind: ExerciseKind; concept: Concept; prompt: string; answer: string; options: Concept[]; direction: "target" | "native"; display?: string };

/**
 * Picks the word to blank in a fill-in: the longest real word (ties: the first), so the learner
 * keeps enough context. Returns null when the phrase has fewer than two words (nothing to infer)
 * or is written without spaces (Japanese), so the slot uses another exercise type instead.
 */
export function fillBlank(text: string): { display: string; answer: string } | null {
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  const words = parts.map((part) => part.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""));
  const count = (word: string) => words.filter((w) => w.toLocaleLowerCase() === word.toLocaleLowerCase()).length;
  let best = -1, bestLength = 0;
  // A word that appears twice ("step by step") would give the answer away, so only blank unique words.
  words.forEach((word, i) => {
    if (word.length > bestLength && count(word) === 1) { best = i; bestLength = word.length; }
  });
  if (best < 0 || bestLength < 2) return null;
  const word = words[best]!;
  const display = parts.map((part, i) => (i === best ? part.replace(word, "_____") : part)).join(" ");
  return { display, answer: word };
}

const LESSON_PLAN: ExerciseKind[] = ["choose", "listen", "translate", "fill", "choose", "speak", "listen", "translate", "fill", "choose"];
/** Reviews favour recall (producing the phrase) over recognition. */
const REVIEW_PLAN: ExerciseKind[] = ["translate", "listen", "fill", "speak", "choose", "translate", "fill", "listen", "choose", "translate"];

/** Builds one exercise per plan slot, cycling through `concepts`; distractors come from `pool`. */
export function buildExercises(concepts: Concept[], pool: Concept[], native: NativeLang, target: TargetLang, idPrefix: string, plan: ExerciseKind[] = LESSON_PLAN): Exercise[] {
  const used = new Set<string>();
  const targetName = langName(target, "en");
  return plan.map((wanted, i) => {
    const concept = concepts[i % concepts.length]!;
    const source = concept.tr[native] || concept.tr.en;
    const targetText = concept.tr[target] || concept.tr.es;
    const blank = fillBlank(targetText);
    // Each (type, phrase, direction) appears once per session; if the planned type does not fit
    // this phrase (e.g. a one-word phrase cannot be a fill-in), use the next type that does.
    const candidates: { kind: ExerciseKind; direction: "target" | "native" }[] = [
      { kind: wanted, direction: wanted === "listen" || (wanted === "choose" && i === plan.length - 1) ? "native" : "target" },
      { kind: "translate", direction: "target" }, { kind: "choose", direction: "native" },
      { kind: "choose", direction: "target" }, { kind: "listen", direction: "native" }, { kind: "speak", direction: "target" },
    ];
    const pick = candidates.find((c) => (c.kind !== "fill" || blank) && !used.has(`${c.kind}:${concept.id}:${c.direction}`)) ?? candidates[1]!;
    used.add(`${pick.kind}:${concept.id}:${pick.direction}`);
    const { kind, direction } = pick;
    const prompt = kind === "choose" ? `Choose the ${direction === "target" ? targetName : langName(native, "en")} translation for “${direction === "target" ? source : targetText}”.`
      : kind === "listen" ? "Listen and choose the meaning of the spoken phrase."
      : kind === "translate" ? `Translate “${source}” into ${targetName}.`
      : kind === "fill" ? `Complete the ${targetName} phrase that means “${source}”.`
      : `Say this phrase in ${targetName}.`;
    const answer = kind === "fill" ? blank!.answer : direction === "target" ? targetText : source;
    const optionPool = shuffle(pool.filter((candidate) => candidate.id !== concept.id));
    const options = shuffle([concept, ...optionPool.slice(0, 3)]);
    return { id: `${idPrefix}-q${i + 1}`, kind, concept, prompt, answer, options, direction, display: kind === "fill" ? blank!.display : undefined };
  });
}

/** Ten varied, offline-capable exercises per lesson; no API call is needed for core practice. */
export function buildLessonExercises(unit: number, node: number, native: NativeLang, target: TargetLang): Exercise[] {
  const actualUnit = unit % UNITS.length;
  const concepts = nodeConcepts(actualUnit, node % NODES_PER_UNIT);
  const pool = unitConcepts(actualUnit).length ? unitConcepts(actualUnit) : CONCEPTS;
  return buildExercises(concepts.length ? concepts : CONCEPTS.slice(0, 3), pool, native, target, `u${unit}-n${node}`);
}

/** Ten recall-focused exercises over the phrases chosen by the Leitner schedule. */
export function buildReviewExercises(ids: string[], native: NativeLang, target: TargetLang): Exercise[] {
  const byId = new Map(CONCEPTS.map((c) => [c.id, c]));
  const concepts = ids.map((id) => byId.get(id)).filter((c): c is Concept => Boolean(c));
  if (!concepts.length) return [];
  const units = new Set(concepts.map((c) => c.unit));
  const pool = CONCEPTS.filter((c) => units.has(c.unit));
  return buildExercises(concepts, pool.length > 3 ? pool : CONCEPTS, native, target, "review", REVIEW_PLAN);
}

/** The first lesson not yet finished, in path order (nothing is locked; this is a recommendation). */
export function nextLesson(done: number[], startUnit = 0): number {
  const finished = new Set(done);
  const total = UNITS.length * NODES_PER_UNIT;
  // From the placement level onwards first; if all of that is done, any earlier gap.
  for (let i = startUnit * NODES_PER_UNIT; i < total; i++) if (!finished.has(i)) return i;
  for (let i = 0; i < total; i++) if (!finished.has(i)) return i;
  return 0;
}

type View = { type: "placement" } | { type: "lesson"; node: number } | { type: "reviewPrompt" } | { type: "review"; ids: string[] } | { type: "reviewDone"; up: number; total: number } | null;

export function LearnPath({ lingo, reward, fail }: { lingo: Lingo; reward: (xp: number) => void; fail: () => void }) {
  const { s, done, deck, sinceReview, completeNode, finishReview, placedUnit, placementSeen, setPlacement } = lingo;
  const t = makeT(s.native);
  const es = s.native === "es";
  const [view, setView] = useState<View>(null);
  const next = nextLesson(done, placedUnit ?? 0);
  const nextUnit = Math.floor(next / NODES_PER_UNIT);
  const currentLevel = UNITS[nextUnit]!.level;
  const [open, setOpen] = useState<Set<Cefr>>(() => new Set([currentLevel]));
  useEffect(() => { setOpen((prev) => new Set([...prev, currentLevel])); }, [currentLevel]);
  const today = dayNumber();
  const stats = deckStats(deck, today);
  const reviewDue = sinceReview >= LESSONS_PER_REVIEW || stats.due > 0;
  const startReview = () => {
    const ids = pickReview(deck, today);
    if (ids.length) setView({ type: "review", ids });
  };

  if (view?.type === "placement") {
    return <PlacementTest lingo={lingo} onCancel={() => setView(null)} onFinish={(unit) => {
      setPlacement(unit);
      setOpen((prev) => new Set([...prev, UNITS[unit]!.level]));
      setView(null);
    }} />;
  }
  if (!placementSeen && done.length === 0) {
    return <Card className="mx-auto max-w-xl space-y-4 text-center">
      <div className="text-6xl">🧭</div>
      <h2 className="text-3xl font-extrabold">{es ? `¿Ya sabes algo de ${langName(s.target, s.native).toLowerCase()}?` : `Already know some ${langName(s.target, s.native)}?`}</h2>
      <p className="text-muted-foreground">{es ? "Haz una prueba de nivel de 3 minutos y empieza en el punto justo. Sin micrófono." : "Take a 3-minute placement test and start at the right level. No microphone needed."}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Btn className="flex-1" onClick={() => setView({ type: "placement" })}>{es ? "Hacer la prueba" : "Take the test"}</Btn>
        <Btn variant="ghost" className="flex-1" onClick={() => setPlacement(undefined)}>{es ? "Empezar desde cero" : "Start from zero"}</Btn>
      </div>
    </Card>;
  }
  if (view?.type === "lesson") {
    const unit = Math.floor(view.node / NODES_PER_UNIT);
    return <LessonRunner key={`lesson-${view.node}`} lingo={lingo} reward={reward} title={`${t("unit")} ${unit + 1} · ${t("lesson")} ${(view.node % NODES_PER_UNIT) + 1}`}
      build={() => buildLessonExercises(unit, view.node % NODES_PER_UNIT, s.native, s.target)}
      onExit={() => setView(null)}
      onFinish={(results) => {
        completeNode(view.node, Object.keys(results).filter((id) => !results[id]));
        reward(10);
        // A review is offered after every LESSONS_PER_REVIEW finished lessons.
        setView(sinceReview + 1 >= LESSONS_PER_REVIEW ? { type: "reviewPrompt" } : null);
      }} />;
  }
  if (view?.type === "review") {
    return <LessonRunner key={`review-${view.ids.join()}`} lingo={lingo} reward={reward} title={es ? "Repaso" : "Review"}
      build={() => buildReviewExercises(view.ids, s.native, s.target)}
      onExit={() => setView(null)}
      onFinish={(results) => {
        finishReview(results);
        reward(15);
        setView({ type: "reviewDone", up: Object.values(results).filter(Boolean).length, total: Object.keys(results).length });
      }} />;
  }
  if (view?.type === "reviewPrompt" || view?.type === "reviewDone") {
    const prompt = view.type === "reviewPrompt";
    const count = pickReview(deck, today).length;
    return <Card className="mx-auto max-w-xl space-y-4 text-center">
      <div className="text-6xl">{prompt ? "🧠" : "🎉"}</div>
      <h2 className="text-3xl font-extrabold">{prompt ? (es ? "¡Hora de repasar!" : "Review time!") : s.name ? t("wellDone", { name: s.name }) : (es ? "¡Repaso completado!" : "Review complete!")}</h2>
      <p className="text-muted-foreground">{prompt
        ? (es ? `Has terminado ${LESSONS_PER_REVIEW} lecciones. Un repaso rápido de ${count} frases las fija en tu memoria.` : `You finished ${LESSONS_PER_REVIEW} lessons. A quick review of ${count} phrases locks them into memory.`)
        : (es ? `${view.up} de ${view.total} frases suben de nivel; las demás volverán pronto. +15 XP` : `${view.up} of ${view.total} phrases moved up a box; the rest will come back soon. +15 XP`)}</p>
      <LeitnerBoxes deck={deck} es={es} />
      <div className="flex gap-2">
        {prompt && <Btn className="flex-1" onClick={startReview} disabled={!count}>{es ? "Empezar repaso" : "Start review"}</Btn>}
        <Btn variant={prompt ? "ghost" : "primary"} className="flex-1" onClick={() => setView(null)}>{prompt ? (es ? "Más tarde" : "Later") : t("cont")}</Btn>
      </div>
    </Card>;
  }
  const finished = new Set(done);
  const toggle = (level: Cefr) => setOpen((prev) => { const copy = new Set(prev); copy.has(level) ? copy.delete(level) : copy.add(level); return copy; });
  return <div className="space-y-6 pb-10">
    {stats.learned > 0 && <button onClick={startReview} className={cn("btn-3d flex w-full items-center justify-between gap-3 p-4 text-left", reviewDue ? "bg-flame text-primary-foreground [--btn-shadow:color-mix(in_oklch,var(--flame)_70%,black)]" : "border-2 border-border bg-card [--btn-shadow:var(--border)]")}>
      <span>
        <span className="block text-xs font-extrabold uppercase opacity-80">{es ? "Repaso espaciado" : "Spaced review"}{sinceReview >= LESSONS_PER_REVIEW ? (es ? " · recomendado ahora" : " · recommended now") : ""}</span>
        <span className="block text-lg font-extrabold">🧠 {stats.due} {es ? "para repasar" : "due"} · {stats.mastered}/{stats.learned} {es ? "dominadas" : "mastered"}</span>
      </span>
      <RotateCcw className="h-7 w-7 shrink-0" />
    </button>}
    <button onClick={() => setView({ type: "lesson", node: next })} className="btn-3d flex w-full items-center justify-between gap-3 bg-primary p-4 text-left text-primary-foreground [--btn-shadow:var(--primary-shadow)]">
      <span>
        <span className="block text-xs font-extrabold uppercase opacity-80">{es ? "Continuar" : "Continue"} · {currentLevel} · {t("unit")} {nextUnit + 1}</span>
        <span className="block text-lg font-extrabold">{UNITS[nextUnit]!.emoji} {unitTitle(nextUnit, s.native)} · {t("lesson")} {(next % NODES_PER_UNIT) + 1}</span>
      </span>
      <Star className="h-7 w-7 shrink-0 fill-current" />
    </button>
    {CEFR_LEVELS.map((band) => {
      const units = Array.from({ length: band.last - band.first + 1 }, (_, i) => band.first + i);
      const total = units.length * NODES_PER_UNIT;
      const completed = units.reduce((sum, u) => sum + Array.from({ length: NODES_PER_UNIT }, (_, n) => finished.has(u * NODES_PER_UNIT + n)).filter(Boolean).length, 0);
      const isOpen = open.has(band.level);
      return <section key={band.level} className="space-y-6">
        <button onClick={() => toggle(band.level)} aria-expanded={isOpen} className="w-full rounded-3xl border-2 border-border bg-card p-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <span className="text-lg font-extrabold">{band.level} · {es ? { A1: "Principiante", A2: "Elemental", B1: "Intermedio", B2: "Intermedio alto" }[band.level] : band.label}</span>
            <span className="text-sm font-bold text-muted-foreground">{t("unit")} {band.first + 1}–{band.last + 1} · {completed}/{total}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completed / total) * 100}%` }} /></div>
        </button>
        {isOpen && units.map((ui) => {
          const unit = UNITS[ui]!;
          return <section key={ui} id={`unit-${ui + 1}`}>
            <div className={cn("mb-6 rounded-3xl p-5", UNIT_STYLE[ui % UNIT_STYLE.length])}>
              <p className="text-xs font-extrabold uppercase opacity-80">{unit.level} · {t("unit")} {ui + 1}</p>
              <h2 className="text-2xl font-extrabold">{unit.emoji} {unitTitle(ui, s.native)}</h2>
              <p className="mt-1 text-sm font-bold opacity-80">{unit.focus} · {es ? "3 lecciones × 10 ejercicios" : "3 lessons × 10 exercises"}</p>
            </div>
            <div className="flex flex-col items-center gap-5">
              {Array.from({ length: NODES_PER_UNIT }).map((_, ni) => {
                const idx = ui * NODES_PER_UNIT + ni; const isDone = finished.has(idx); const isNext = idx === next;
                return <div key={ni} style={{ transform: `translateX(${OFFSET[ni % OFFSET.length]}px)` }} className="relative">
                  {isNext && <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-border bg-card px-3 py-1 text-xs font-extrabold text-primary">{t("start")}</div>}
                  <button onClick={() => setView({ type: "lesson", node: idx })} aria-label={`${t("lesson")} ${idx + 1}${isDone ? ` — ${t("done")}` : ""}`} className={cn("btn-3d grid h-20 w-20 place-items-center rounded-full", isDone ? "bg-flame text-primary-foreground [--btn-shadow:color-mix(in_oklch,var(--flame)_70%,black)]" : isNext ? "bg-primary text-primary-foreground ring-4 ring-accent" : "bg-primary text-primary-foreground opacity-75")}>
                    {isDone ? <Check className="h-9 w-9" strokeWidth={3} /> : <Star className="h-9 w-9 fill-current" />}
                  </button>
                </div>;
              })}
            </div>
          </section>;
        })}
      </section>;
    })}
    <button onClick={() => setView({ type: "placement" })} className="mx-auto block text-sm font-bold text-muted-foreground underline">{es ? "Repetir la prueba de nivel" : "Retake placement test"}</button>
  </div>;
}

/** Five Leitner boxes with how many phrases sit in each (box 5 = mastered). */
function LeitnerBoxes({ deck, es }: { deck: Deck; es: boolean }) {
  const counts = [1, 2, 3, 4, 5].map((box) => Object.values(deck).filter((card) => card.box === box).length);
  return <div className="grid grid-cols-5 gap-2" aria-label={es ? "Cajas de repaso" : "Review boxes"}>
    {counts.map((count, i) => <div key={i} className={cn("rounded-2xl border-2 p-2", i === 4 ? "border-primary bg-success-soft" : "border-border")}>
      <p className="text-xl font-extrabold">{count}</p>
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{es ? "Caja" : "Box"} {i + 1} · {INTERVALS[(i + 1) as 1]}{es ? "d" : "d"}</p>
    </div>)}
  </div>;
}

/**
 * Runs a lesson or a review. Only the first attempt at each exercise counts for the review
 * schedule ("Try again" still lets the learner fix it); a phrase counts as known only if every
 * first attempt on it was right.
 */
function LessonRunner({ lingo, reward, title, build, onExit, onFinish }: { lingo: Lingo; reward: (xp: number) => void; title: string; build: () => Exercise[]; onExit: () => void; onFinish: (results: Record<string, boolean>) => void }) {
  const { s } = lingo; const t = makeT(s.native);
  const targetInfo = TARGETS.find((x) => x.id === s.target)!;
  const questions = useMemo(() => shuffle(build()), []); // eslint-disable-line react-hooks/exhaustive-deps
  const firstTry = useRef(new Map<string, { conceptId: string; correct: boolean }>());
  const [qi, setQi] = useState(0); const [picked, setPicked] = useState<string | null>(null); const [typed, setTyped] = useState(""); const [score, setScore] = useState<number | null>(null);
  const q = questions[qi]!; const speech = useSpeech(targetInfo.locale, s.native); const isTyped = q.kind === "translate" || q.kind === "fill";
  const optionText = (concept: Concept) => q.direction === "target" ? concept.tr[s.target] : concept.tr[s.native];
  useEffect(() => {
    if (q.kind === "listen") speak(q.concept.tr[s.target], { lang: targetInfo.locale, rate: s.rate });
    return () => stopSpeaking();
  }, [q.id, q.kind, q.concept, s.target, s.rate, targetInfo.locale]);

  const evaluate = (correct: boolean, answerScore = correct ? 100 : 0) => {
    setScore(answerScore); setPicked(correct ? q.concept.id : "__wrong__");
    if (!firstTry.current.has(q.id)) firstTry.current.set(q.id, { conceptId: q.concept.id, correct });
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
    if (qi === questions.length - 1) {
      // Only phrases the learner actually answered are graded; skipped speaking questions don't count.
      const results: Record<string, boolean> = {};
      for (const { conceptId, correct } of firstTry.current.values()) results[conceptId] = (results[conceptId] ?? true) && correct;
      onFinish(results);
      return;
    }
    setQi((current) => current + 1); setPicked(null); setTyped(""); setScore(null);
  };
  return <div className="mx-auto max-w-xl space-y-5">
    <div className="flex items-center gap-3"><button aria-label={t("exit")} onClick={onExit}><X className="h-7 w-7 text-muted-foreground" /></button><div className="h-4 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((qi + (picked ? 1 : 0)) / questions.length) * 100}%` }} /></div><span className="text-xs font-extrabold" title={title}>{qi + 1}/{questions.length}</span></div>
    <Card className="space-y-3">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-accent p-3 text-accent-foreground">{q.kind === "listen" ? <Volume2 /> : q.kind === "speak" ? <Mic /> : q.kind === "translate" ? <Languages /> : <PencilLine />}</span><div><p className="text-xs font-extrabold uppercase text-muted-foreground">{q.kind.toUpperCase()}</p><h2 className="text-xl font-extrabold">{q.prompt}</h2></div></div>
      {q.kind === "listen" && <p className="text-sm text-muted-foreground">Audio plays automatically. Replay if you need to hear it again.</p>}
      {q.kind === "speak" && <div className="space-y-2"><p className="text-2xl font-extrabold">{q.concept.tr[s.target]}</p><SpeakButtons text={q.answer} locale={targetInfo.locale} rate={s.rate} native={s.native} /></div>}
      {q.kind === "fill" && <p className="rounded-xl bg-muted p-3 text-xl font-bold">{q.display}</p>}
    </Card>
    {(q.kind === "translate" || q.kind === "fill") && <div className="flex gap-2"><input value={typed} onChange={(event) => setTyped(event.target.value)} onKeyDown={(event) => event.key === "Enter" && checkTyped()} disabled={!!picked} placeholder={q.kind === "fill" ? "Type the missing word…" : `Translate into ${langName(s.target, s.native)}…`} className="min-w-0 flex-1 rounded-2xl border-2 border-border bg-card p-4 font-bold outline-none focus:border-primary" /><Btn onClick={checkTyped} disabled={!typed.trim() || !!picked}>Check</Btn></div>}
    {q.kind === "speak" && <div className="flex flex-col items-center gap-2"><MicButton big listening={speech.listening} disabled={!speech.supported || !!picked || speech.processing} onClick={() => speech.listening ? speech.stop() : speech.listen(checkSpoken, undefined, false)} />{speech.error && <p className="text-xs text-destructive">{speech.error}</p>}{speech.processing && <p role="status" className="text-xs text-primary">Transcribing your recording…</p>}<p className="text-xs text-muted-foreground">{speech.supported ? "Speak the phrase; the recognized words will be checked." : "Speech recognition is not available. Type your answer below."}</p>{!picked && <button onClick={next} className="text-xs font-bold text-muted-foreground underline">{s.native === "es" ? "No puedo hablar ahora" : "Can't speak now"}</button>}{!speech.supported && <div className="flex w-full gap-2"><input value={typed} onChange={(event) => setTyped(event.target.value)} placeholder="Type what you said" className="min-w-0 flex-1 rounded-xl border-2 border-border bg-card p-3" /><Btn onClick={() => { const r = compareSpeech(q.answer, typed, s.target); evaluate(r.score >= 80, r.score); }}>Check</Btn></div>}</div>}
    {(q.kind === "choose" || q.kind === "listen") && <div className="grid gap-3">{q.options.map((option) => <button key={option.id} disabled={!!picked || q.kind === "speak"} onClick={() => choose(option.id)} className={cn("rounded-2xl border-2 border-b-4 p-4 text-left text-lg font-bold transition", !picked && "border-border hover:bg-muted", picked && option.id === q.concept.id && "border-success bg-success-soft", picked === option.id && option.id !== q.concept.id && "border-destructive bg-danger-soft", picked && option.id !== q.concept.id && "opacity-60")}>{optionText(option)}</button>)}</div>}
    {picked && <div className={cn("space-y-3 rounded-2xl p-4", picked === q.concept.id ? "bg-success-soft" : "bg-danger-soft")}><p className="font-extrabold">{picked === q.concept.id ? "Correct! Nice work." : `Not quite. Correct answer: ${q.answer}`}</p>{score !== null && <ScoreBar label="Response match" value={score} />}<div className="flex gap-2">{picked !== q.concept.id && <Btn variant="ghost" className="flex-1" onClick={() => { setPicked(null); setScore(null); setTyped(""); }}>Try again</Btn>}<Btn className="flex-1" onClick={next}>{qi === questions.length - 1 ? t("finish") : t("cont")}</Btn></div></div>}
  </div>;
}
