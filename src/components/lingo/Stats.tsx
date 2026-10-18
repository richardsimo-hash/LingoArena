import { Flame, Gem, Heart, Trophy, Mic, Swords, Zap } from "lucide-react";
import { TARGETS } from "@/lib/lingo/content";
import { langName, makeT } from "@/lib/lingo/i18n";
import { levelFromXp, MAX_HEARTS, TOTAL_NODES, type Lingo } from "@/lib/lingo/store";
import { Card } from "./ui";

export function Stats({ lingo }: { lingo: Lingo }) {
  const { s } = lingo;
  const t = makeT(s.native);
  const lvl = levelFromXp(s.xp);
  const into = s.xp % 100;
  const tiles = [
    { icon: Flame, label: t("streak"), value: s.streak, cls: "text-flame" },
    { icon: Gem, label: t("totalXp"), value: s.xp, cls: "text-gem" },
    { icon: Heart, label: t("hearts"), value: `${s.hearts}/${MAX_HEARTS}`, cls: "text-heart" },
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
      <Card>
        <h3 className="mb-3 text-xl font-extrabold">{t("pathProg")}</h3>
        <div className="space-y-3">
          {TARGETS.filter((x) => x.id !== s.native).map((x) => {
            const c = s.progress[x.id]?.completed ?? 0;
            return (
              <div key={x.id} className="flex items-center gap-3">
                <span className="text-2xl" title={langName(x.id, s.native)}>{x.flag}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(c / TOTAL_NODES) * 100}%` }} /></div>
                <span className="w-12 text-right text-sm font-bold">{c}/{TOTAL_NODES}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
