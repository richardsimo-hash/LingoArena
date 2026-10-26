import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Play, Volume2, X } from "lucide-react";
import { TARGETS, UNITS, unitConcepts, type Concept } from "@/lib/lingo/content";
import { shuffle } from "@/lib/lingo/engine";
import { makeT, unitTitle } from "@/lib/lingo/i18n";
import { createSentenceSpeaker } from "@/lib/lingo/sentenceSpeaker";
import type { Lingo } from "@/lib/lingo/store";
import { naturalVoiceEnabled, speak, stopSpeaking } from "@/lib/voice";
import { Btn, Card } from "./ui";
import { cn } from "@/lib/utils";

const SPEAKERS = [{ name: "Chloe", emoji: "👩🏻‍🏫" }, { name: "Leo", emoji: "🧑🏽" }];

/** Listen to a unit's phrases as a short two-person scene, then answer 4 listening questions. */
export function ListeningPractice({ lingo, unit, reward, onExit }: { lingo: Lingo; unit: number; reward: (xp: number) => void; onExit: () => void }) {
  const { s } = lingo;
  const t = makeT(s.native);
  const tg = TARGETS.find((x) => x.id === s.target)!;
  const lines = unitConcepts(unit);
  const questions = useMemo(() => shuffle(lines).slice(0, 4).map((c) => ({ concept: c, options: shuffle([c, ...shuffle(lines.filter((x) => x.id !== c.id)).slice(0, 3)]) })), [unit]); // eslint-disable-line react-hooks/exhaustive-deps
  const [stage, setStage] = useState<"scene" | "quiz" | "done">("scene");
  const [playing, setPlaying] = useState(-1);
  const [showText, setShowText] = useState(false);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const speakerRef = useRef<ReturnType<typeof createSentenceSpeaker> | null>(null);
  useEffect(() => () => { speakerRef.current?.cancel(); stopSpeaking(); }, []);

  // Play the scene line by line (natural voice when enabled), highlighting the current line.
  const playScene = (from = 0) => {
    speakerRef.current?.cancel(); stopSpeaking();
    const playLine = (i: number) => {
      if (i >= lines.length) { setPlaying(-1); return; }
      setPlaying(i);
      // Chloe and Leo alternate, each with their own voice.
      const speaker = createSentenceSpeaker({ lang: tg.locale, rate: s.rate, natural: naturalVoiceEnabled(), voice: i % 2 ? "alt" : "main", onDone: () => window.setTimeout(() => playLine(i + 1), 350) });
      speakerRef.current = speaker;
      speaker.update(lines[i]!.tr[s.target], true);
    };
    playLine(from);
  };
  const q = questions[qi];
  useEffect(() => { if (stage === "quiz" && q) speak(q.concept.tr[s.target], { lang: tg.locale, rate: s.rate }); }, [stage, qi]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (c: Concept) => {
    if (picked || !q) return;
    setPicked(c.id);
    if (c.id === q.concept.id) setCorrect((n) => n + 1);
  };
  const next = () => {
    if (qi === questions.length - 1) { setStage("done"); reward(10); return; }
    setQi(qi + 1); setPicked(null);
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-2">
        <button aria-label={t("exit")} onClick={onExit}><X className="h-7 w-7 text-muted-foreground" /></button>
        <p className="font-extrabold">🎧 {t("listening2")} · {UNITS[unit]!.emoji} {unitTitle(unit, s.native)}</p>
      </div>
      {stage === "scene" && <>
        <Card className="space-y-2">
          {lines.map((c, i) => {
            const who = SPEAKERS[i % 2]!;
            return <button key={c.id} onClick={() => playScene(i)} className={cn("flex w-full items-start gap-2 rounded-xl p-2 text-left transition", i % 2 && "flex-row-reverse text-right", playing === i ? "bg-accent" : "hover:bg-muted")}>
              <span className="text-2xl">{who.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-extrabold uppercase text-muted-foreground">{who.name}</span>
                <span className="block font-bold">{showText ? c.tr[s.target] : playing === i ? "🔊 …" : "• • •"}</span>
                {showText && <span className="block text-xs text-muted-foreground">{c.tr[s.native]}</span>}
              </span>
            </button>;
          })}
        </Card>
        <div className="flex gap-2">
          <Btn variant="secondary" className="flex-1" onClick={() => playScene(0)}><Play className="mr-2 inline h-4 w-4" />{t("playScene")}</Btn>
          <Btn variant="ghost" onClick={() => setShowText(!showText)}>{showText ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Btn>
        </div>
        <Btn className="w-full" onClick={() => { speakerRef.current?.cancel(); stopSpeaking(); setPlaying(-1); setStage("quiz"); }}>{t("cont")}</Btn>
      </>}
      {stage === "quiz" && q && <>
        <Card className="space-y-2 text-center">
          <p className="text-xs font-extrabold uppercase text-muted-foreground">{qi + 1}/{questions.length} · {t("exListen")}</p>
          <button onClick={() => speak(q.concept.tr[s.target], { lang: tg.locale, rate: s.rate })} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary text-secondary-foreground"><Volume2 className="h-8 w-8" /></button>
        </Card>
        <div className="grid gap-2">
          {q.options.map((o) => (
            <button key={o.id} disabled={!!picked} onClick={() => answer(o)} className={cn("rounded-2xl border-2 border-b-4 p-3 text-left font-bold", !picked && "border-border hover:bg-muted", picked && o.id === q.concept.id && "border-success bg-success-soft", picked === o.id && o.id !== q.concept.id && "border-destructive bg-danger-soft")}>{o.tr[s.native]}</button>
          ))}
        </div>
        {picked && <Btn className="w-full" onClick={next}>{qi === questions.length - 1 ? t("finish") : t("cont")}</Btn>}
      </>}
      {stage === "done" && <Card className="space-y-3 text-center">
        <div className="text-5xl">🎧</div>
        <p className="text-2xl font-extrabold">{correct}/{questions.length} · +10 XP</p>
        <Btn className="w-full" onClick={onExit}>{t("cont")}</Btn>
      </Card>}
    </div>
  );
}
