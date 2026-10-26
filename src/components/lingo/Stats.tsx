import { useState } from "react";
import { Flame, Gem, Trophy, Mic, Swords, Zap, Share2 } from "lucide-react";
import { NODES_PER_UNIT, TARGETS, UNITS } from "@/lib/lingo/content";
import { langName, makeT, unitTitle } from "@/lib/lingo/i18n";
import { levelFromXp, today, TOTAL_NODES, type Lingo } from "@/lib/lingo/store";
import { ACHIEVEMENTS, achievementTitle, progressFacts } from "@/lib/lingo/achievements";
import { nextLesson } from "./LearnPath";
import { Btn, Card } from "./ui";
import { cn } from "@/lib/utils";

export function Stats({ lingo }: { lingo: Lingo }) {
  const { s } = lingo;
  const t = makeT(s.native);
  const lvl = levelFromXp(s.xp);
  const into = s.xp % 100;
  const tiles = [
    { icon: Flame, label: t("streak"), value: s.streak, cls: "text-flame" },
    { icon: Gem, label: t("totalXp"), value: s.xp, cls: "text-gem" },
    { icon: Swords, label: t("bossStat"), value: s.grammarWins, cls: "text-primary" },
    { icon: Mic, label: t("bestAcc"), value: `${s.bestPron}%`, cls: "text-secondary" },
    { icon: Zap, label: t("rapidBest"), value: `${s.rapidBest} XP`, cls: "text-flame" },
  ];
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Card className="flex items-center gap-4">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground"><Trophy className="h-10 w-10" /></div>
        <div className="flex-1">
          <p className="text-3xl font-extrabold">{t("level")} {lvl}</p>
          <div className="mt-2 h-4 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${into}%` }} /></div>
          <p className="mt-1 text-xs font-bold text-muted-foreground">{100 - into} {t("toLevel")} {lvl + 1}</p>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((x) => (
          <Card key={x.label} className="p-4">
            <x.icon className={`h-7 w-7 ${x.cls}`} />
            <p className="mt-2 text-2xl font-extrabold">{x.value}</p>
            <p className="text-xs font-bold uppercase text-muted-foreground">{x.label}</p>
          </Card>
        ))}
      </div>
      <ParentReport lingo={lingo} />
      <Card>
        <h3 className="mb-3 text-xl font-extrabold">{t("achievementsT")} · {s.achievements.length}/{ACHIEVEMENTS.length}</h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const got = s.achievements.includes(a.id);
            return <div key={a.id} className={cn("rounded-2xl border-2 p-2 text-center", got ? "border-flame bg-accent" : "border-border opacity-45 grayscale")} title={achievementTitle(a, s.native)}>
              <div className="text-3xl">{a.emoji}</div>
              <p className="text-[11px] font-bold leading-tight">{achievementTitle(a, s.native)}</p>
            </div>;
          })}
        </div>
      </Card>
      <Card>
        <h3 className="mb-3 text-xl font-extrabold">{t("pathProg")}</h3>
        <div className="space-y-3">
          {TARGETS.filter((x) => x.id !== s.native).map((x) => {
            const c = s.progress[x.id]?.completed ?? 0;
            const available = TOTAL_NODES;
            return (
              <div key={x.id} className="flex items-center gap-3">
                <span className="text-2xl" title={langName(x.id, s.native)}>{x.flag}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (c / available) * 100)}%` }} /></div>
                <span className="w-20 text-right text-sm font-bold">{c}/{available}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/** Weekly summary for a parent or teacher: last 7 days of XP plus the key numbers, shareable as text. */
function ParentReport({ lingo }: { lingo: Lingo }) {
  const { s, done, placedUnit, deck } = lingo;
  const t = makeT(s.native);
  const [copied, setCopied] = useState(false);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return today(d); });
  const xpByDay = days.map((d) => s.dailyXp[d] ?? 0);
  const max = Math.max(s.dailyGoal, ...xpByDay);
  const weekXp = xpByDay.reduce((a, b) => a + b, 0);
  const facts = progressFacts(s);
  const unit = Math.floor(nextLesson(done, placedUnit ?? 0) / NODES_PER_UNIT);
  const cards = Object.values(deck);
  const lines = [
    `${t("parentReport")} — ${s.name || "LingoArena"} · ${langName(s.target, s.native)}`,
    `${t("currentlyAt")}: ${UNITS[unit]!.level} · ${t("unit")} ${unit + 1} (${unitTitle(unit, s.native)})`,
    `${t("weekXp")}: ${weekXp} · ${t("streak")}: ${s.streak}`,
    `${t("lessonsDone")}: ${done.length}/${TOTAL_NODES} · ${t("phrasesLearned")}: ${cards.length} · ${t("phrasesMastered")}: ${cards.filter((c) => c.box === 5).length}`,
    `${t("reviewsT")}: ${s.reviewsDone} · ${t("achievementsT")}: ${s.achievements.length}/${ACHIEVEMENTS.length}`,
    `${t("last7")}: ${days.map((d, i) => `${d.slice(5)} ${xpByDay[i]} XP`).join(", ")}`,
  ];
  const share = async () => {
    const text = lines.join("\n");
    try {
      if (navigator.share) { await navigator.share({ title: t("parentReport"), text }); return; }
    } catch { /* cancelled or unsupported: fall back to copying */ }
    try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  };
  const weekday = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(s.native, { weekday: "narrow" });
  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-xl font-extrabold">👨‍👩‍👧 {t("parentReport")}</h3>
        <p className="text-xs text-muted-foreground">{t("parentHint")}</p>
      </div>
      <div className="flex h-28 items-end gap-2" aria-label={t("last7")}>
        {days.map((d, i) => (
          <div key={d} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-muted-foreground">{xpByDay[i]}</span>
            <div className={cn("w-full rounded-t-lg", xpByDay[i]! >= s.dailyGoal ? "bg-flame" : "bg-primary")} style={{ height: `${Math.max(4, (xpByDay[i]! / max) * 80)}px` }} />
            <span className="text-[10px] font-bold uppercase">{weekday(d)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <p><b>{UNITS[unit]!.level} · {t("unit")} {unit + 1}</b><br /><span className="text-xs text-muted-foreground">{t("currentlyAt")}</span></p>
        <p><b>{weekXp} XP</b><br /><span className="text-xs text-muted-foreground">{t("weekXp")}</span></p>
        <p><b>{facts.lessons}</b><br /><span className="text-xs text-muted-foreground">{t("lessonsDone")}</span></p>
        <p><b>{cards.filter((c) => c.box === 5).length}/{cards.length}</b><br /><span className="text-xs text-muted-foreground">{t("phrasesMastered")}</span></p>
      </div>
      <Btn variant="secondary" className="w-full" onClick={() => void share()}><Share2 className="mr-2 inline h-4 w-4" />{copied ? t("copiedReport") : t("shareReport")}</Btn>
    </Card>
  );
}
