import { useMemo, useState } from "react";
import { Check, Star, X, Sparkles } from "lucide-react";
import { NODES_PER_UNIT, TARGETS, UNITS, nodeConcepts, unitConcepts, type Concept } from "@/lib/lingo/content";
import { shuffle } from "@/lib/lingo/engine";
import { makeT, unitTitle } from "@/lib/lingo/i18n";
import { speak } from "@/lib/lingo/audio";
import { levelFromXp, type Lingo } from "@/lib/lingo/store";
import { Btn, Card, SpeakButtons } from "./ui";
import { cn } from "@/lib/utils";

const UNIT_STYLE = [
  "bg-primary text-primary-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-flame text-primary-foreground",
  "bg-heart text-primary-foreground",
  "bg-accent text-accent-foreground",
];
const OFFSET = [0, 56, -56];

export function LearnPath({ lingo, reward, fail }: { lingo: Lingo; reward: (xp: number) => void; fail: () => void }) {
  const { s, done } = lingo;
  // Each XP level adds another mixed-practice unit. All units remain accessible.
  const visibleUnitCount = UNITS.length + Math.max(1, levelFromXp(s.xp) - 1);
  const t = makeT(s.native);
  const [lesson, setLesson] = useState<number | null>(null);

  if (lesson !== null) return <Lesson lingo={lingo} node={lesson} reward={reward} fail={fail} onExit={() => setLesson(null)} />;

  return (
    <div className="space-y-10 pb-10">
      {Array.from({ length: visibleUnitCount }, (_, ui) => {
        const u = UNITS[ui % UNITS.length]!;
        const generated = ui >= UNITS.length;
        return (
        <section key={ui}>
          <div className={cn("mb-6 rounded-3xl p-5", UNIT_STYLE[ui % UNIT_STYLE.length])}>
            <p className="text-xs font-extrabold uppercase opacity-80">{t("unit")} {ui + 1}{generated ? " · MIXED PRACTICE" : ""}</p>
            <h2 className="text-2xl font-extrabold">{generated ? <><Sparkles className="mr-1 inline h-5 w-5" />{s.native === "es" ? "Práctica infinita" : "Endless practice"}</> : <>{u.emoji} {unitTitle(ui, s.native)}</>}</h2>
          </div>
          <div className="flex flex-col items-center gap-5">
            {Array.from({ length: NODES_PER_UNIT }).map((_, ni) => {
              const idx = ui * NODES_PER_UNIT + ni;
              const isDone = done.includes(idx);
              return (
                <div key={ni} style={{ transform: `translateX(${OFFSET[ni % OFFSET.length]}px)` }} className="relative">
                  {!isDone && ni === 0 && <div className="absolute -top-9 left-1/2 -translate-x-1/2 animate-bounce whitespace-nowrap rounded-xl border-2 border-border bg-card px-3 py-1 text-xs font-extrabold text-primary">{t("start")}</div>}
                  {/* Every lesson is open: no locks, no ordering, no hearts gate. */}
                  <button onClick={() => setLesson(idx)} aria-label={`${t("lesson")} ${idx + 1}${isDone ? ` — ${t("done")}` : ""}`}
                    className={cn("btn-3d grid h-20 w-20 place-items-center rounded-full",
                      isDone ? "bg-flame text-primary-foreground [--btn-shadow:color-mix(in_oklch,var(--flame)_70%,black)]" : "bg-primary text-primary-foreground ring-4 ring-accent")}>
                    {isDone ? <Check className="h-9 w-9" strokeWidth={3} /> : <Star className="h-9 w-9 fill-current" />}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      );
      })}
    </div>
  );
}

type Q = { c: Concept; reverse: boolean; options: Concept[] };

function Lesson({ lingo, node, reward, fail, onExit }: { lingo: Lingo; node: number; reward: (xp: number) => void; fail: () => void; onExit: () => void }) {
  const { s, completeNode } = lingo;
  const t = makeT(s.native);
  const locale = TARGETS.find((x) => x.id === s.target)!.locale;
  const unit = Math.floor(node / NODES_PER_UNIT);
  const nodeInUnit = node % NODES_PER_UNIT;
  const contentUnit = unit % UNITS.length;

  // Each lesson owns its 3 concepts (never shared with another lesson or unit).
  const questions = useMemo<Q[]>(() => {
    const pool = nodeConcepts(contentUnit, nodeInUnit);
    const unitPool = unitConcepts(contentUnit);
    return shuffle(pool).map((c, i) => {
      // Type A: prompt in NATIVE, options in TARGET.  Type B: prompt in TARGET (+audio), options in NATIVE.
      // Never print the answer in the other language on the same screen.
      let reverse = (node + i) % 2 === 1;
      const promptOf = (rev: boolean) => (rev ? c.tr[s.target] : c.tr[s.native]);
      const answerOf = (rev: boolean) => (rev ? c.tr[s.native] : c.tr[s.target]);
      if (promptOf(reverse).trim().toLowerCase() === answerOf(reverse).trim().toLowerCase()) reverse = !reverse;
      const optText = (x: Concept) => (reverse ? x.tr[s.native] : x.tr[s.target]);
      const seen = new Set<string>([
        optText(c).trim().toLowerCase(),
        promptOf(reverse).trim().toLowerCase(),
        answerOf(reverse).trim().toLowerCase(),
        c.tr[s.native].trim().toLowerCase(),
        c.tr[s.target].trim().toLowerCase(),
      ]);
      const distract: Concept[] = [];
      for (const x of shuffle(unitPool.filter((y) => y.id !== c.id))) {
        const tx = optText(x).trim();
        if (seen.has(tx.toLowerCase())) continue;
        seen.add(tx.toLowerCase()); distract.push(x);
        if (distract.length === 3) break;
      }
      return { c, reverse, options: shuffle([c, ...distract]) };
    });
  }, [s.target, s.native, contentUnit, nodeInUnit, node]);

  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [anim, setAnim] = useState("");
  const q = questions[qi]!;
  const correct = picked === q.c.id;
  const optText = (x: Concept) => (q.reverse ? x.tr[s.native] : x.tr[s.target]);

  const choose = (id: string) => {
    if (picked) return;
    setPicked(id);
    speak(q.c.tr[s.target], locale, s.rate); // hear the right phrase after answering
    if (id === q.c.id) { setAnim("animate-pop"); reward(5); }
    else { setAnim("animate-shake"); fail(); }
  };
  const next = () => {
    if (qi === questions.length - 1) { completeNode(node); reward(10); onExit(); return; }
    setQi(qi + 1); setPicked(null); setAnim("");
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <button aria-label={t("exit")} onClick={onExit}><X className="h-7 w-7 text-muted-foreground" /></button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((qi + (picked ? 1 : 0)) / questions.length) * 100}%` }} /></div>
      </div>
      <h2 className="text-2xl font-extrabold">{q.reverse ? t("whatMean") : t("howSay")}</h2>
      <Card className={cn("flex items-center justify-between gap-3", anim)}>
        <span className="text-2xl font-extrabold">{q.reverse ? q.c.tr[s.target] : q.c.tr[s.native]}</span>
        {q.reverse && <SpeakButtons text={q.c.tr[s.target]} locale={locale} rate={s.rate} native={s.native} />}
      </Card>
      <div className="grid gap-3">
        {q.options.map((o) => {
          const isAns = o.id === q.c.id, isPicked = picked === o.id;
          return (
            <button key={o.id} onClick={() => choose(o.id)}
              className={cn("rounded-2xl border-2 border-b-4 p-4 text-left text-lg font-bold transition",
                !picked && "border-border hover:bg-muted",
                picked && isAns && "border-success bg-success-soft",
                picked && isPicked && !isAns && "border-destructive bg-danger-soft",
                picked && !isAns && !isPicked && "border-border opacity-50")}>
              {optText(o)}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className={cn("flex items-center justify-between gap-3 rounded-2xl p-4 animate-in slide-in-from-bottom-4", correct ? "bg-success-soft" : "bg-danger-soft")}>
          <span className="font-extrabold">{correct ? t("nailed") : `${t("correctIs")}: ${optText(q.c)}`}</span>
          <Btn variant={correct ? "primary" : "danger"} onClick={next}>{qi === questions.length - 1 ? t("finish") : t("cont")}</Btn>
        </div>
      )}
    </div>
  );
}
