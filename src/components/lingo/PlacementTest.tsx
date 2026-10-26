import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { CEFR_LEVELS, UNITS } from "@/lib/lingo/content";
import { PASS_MARK, QUESTIONS_PER_LEVEL, placementQuestions, placementUnit } from "@/lib/lingo/placement";
import { langName, makeT, unitTitle } from "@/lib/lingo/i18n";
import type { Lingo } from "@/lib/lingo/store";
import { Btn, Card } from "./ui";
import { cn } from "@/lib/utils";

/** Short adaptive placement test (multiple choice, no microphone needed). */
export function PlacementTest({ lingo, onFinish, onCancel }: { lingo: Lingo; onFinish: (unit: number) => void; onCancel: () => void }) {
  const { s } = lingo;
  const t = makeT(s.native);
  const es = s.native === "es";
  const [levelIndex, setLevelIndex] = useState(0);
  const [qi, setQi] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const level = CEFR_LEVELS[levelIndex]!;
  const questions = useMemo(() => placementQuestions(level.level), [level.level]);
  const q = questions[qi];
  const correctSoFar = scores[levelIndex] ?? 0;

  const answer = (id: string) => {
    if (picked || !q) return;
    setPicked(id);
    const right = id === q.concept.id;
    const levelCorrect = correctSoFar + (right ? 1 : 0);
    const nextScores = [...scores]; nextScores[levelIndex] = levelCorrect;
    window.setTimeout(() => {
      setPicked(null);
      setScores(nextScores);
      const answered = qi + 1;
      const remaining = QUESTIONS_PER_LEVEL - answered;
      // Stop the level early once the outcome is certain either way.
      const failed = levelCorrect + remaining < PASS_MARK;
      const passed = levelCorrect >= PASS_MARK && remaining === 0;
      if (failed || (answered === QUESTIONS_PER_LEVEL && !passed)) { setResult(placementUnit(nextScores)); return; }
      if (answered < QUESTIONS_PER_LEVEL) { setQi(answered); return; }
      if (levelIndex === CEFR_LEVELS.length - 1) { setResult(placementUnit(nextScores)); return; }
      setLevelIndex(levelIndex + 1); setQi(0);
    }, 700);
  };

  if (result !== null) {
    const unit = UNITS[result]!;
    return <Card className="mx-auto max-w-xl space-y-4 text-center">
      <div className="text-6xl">🎯</div>
      <h2 className="text-3xl font-extrabold">{es ? `¡Empiezas en ${unit.level}!` : `You're starting at ${unit.level}!`}</h2>
      <p className="text-muted-foreground">{t("unit")} {result + 1} · {unit.emoji} {unitTitle(result, s.native)}</p>
      <p className="text-sm text-muted-foreground">{es ? "Puedes abrir cualquier lección anterior cuando quieras." : "You can still open any earlier lesson whenever you like."}</p>
      <Btn className="w-full" onClick={() => onFinish(result)}>{t("cont")}</Btn>
    </Card>;
  }
  if (!q) return null;
  const total = QUESTIONS_PER_LEVEL * CEFR_LEVELS.length;
  const position = levelIndex * QUESTIONS_PER_LEVEL + qi;
  return <div className="mx-auto max-w-xl space-y-5">
    <div className="flex items-center gap-3">
      <button aria-label={t("exit")} onClick={onCancel}><X className="h-7 w-7 text-muted-foreground" /></button>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${(position / total) * 100}%` }} /></div>
      <span className="text-xs font-extrabold">{level.level}</span>
    </div>
    <Card className="space-y-2">
      <p className="text-xs font-extrabold uppercase text-muted-foreground">{es ? "Prueba de nivel" : "Placement test"} · {level.level}</p>
      <h2 className="text-xl font-extrabold">{es ? `Elige cómo se dice en ${langName(s.target, s.native).toLowerCase()}:` : `Choose the ${langName(s.target, s.native)} for:`} “{q.concept.tr[s.native]}”</h2>
    </Card>
    <div className="grid gap-3">
      {q.options.map((option) => (
        <button key={option.id} disabled={!!picked} onClick={() => answer(option.id)}
          className={cn("rounded-2xl border-2 border-b-4 p-4 text-left text-lg font-bold transition", !picked && "border-border hover:bg-muted",
            picked && option.id === q.concept.id && "border-success bg-success-soft", picked === option.id && option.id !== q.concept.id && "border-destructive bg-danger-soft")}>
          {option.tr[s.target]}
        </button>
      ))}
    </div>
    <button onClick={() => setResult(placementUnit([...scores.slice(0, levelIndex), 0]))} className="mx-auto block text-xs font-bold text-muted-foreground underline">{es ? "No lo sé — termina aquí" : "I don't know — stop here"}</button>
  </div>;
}
