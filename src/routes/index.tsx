import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, Gem, Heart, Settings as SettingsIcon, Map, Mic, Swords, BarChart3, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { NATIVES, TARGETS, type NativeLang, type TargetLang } from "@/lib/lingo/content";
import { useLingo, levelFromXp } from "@/lib/lingo/store";
import { langName, makeT, type K } from "@/lib/lingo/i18n";
import { sfx, stopSpeaking } from "@/lib/lingo/audio";
import { Settings } from "@/components/lingo/Settings";
import { LearnPath } from "@/components/lingo/LearnPath";
import { GrammarBattle } from "@/components/lingo/GrammarBattle";
import { SpeechArena } from "@/components/lingo/SpeechArena";
import { FreeChat } from "@/components/lingo/FreeChat";
import { Stats } from "@/components/lingo/Stats";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LingoArena AI — Gamified Language Battles" },
      { name: "description", content: "Free, gamified language practice with speech duels, listening battles and free conversation with an AI avatar." },
      { property: "og:title", content: "LingoArena AI — Gamified Language Battles" },
      { property: "og:description", content: "Speak, battle and level up in 7 languages. Free forever, right in your browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

const TABS = [
  { id: "learn", key: "learn", icon: Map },
  { id: "arena", key: "arena", icon: Mic },
  { id: "grammar", key: "grammar", icon: Swords },
  { id: "chat", key: "chat", icon: MessageCircle },
  { id: "stats", key: "stats", icon: BarChart3 },
] as const satisfies readonly { id: string; key: K; icon: unknown }[];
type Tab = (typeof TABS)[number]["id"];

function App() {
  const lingo = useLingo();
  const { s, loaded, update, addXp, loseHeart } = lingo;
  const t = makeT(s.native);
  const [tab, setTab] = useState<Tab>("learn");
  const [showSettings, setShowSettings] = useState(false);
  const [bump, setBump] = useState(0);
  const target = TARGETS.find((x) => x.id === s.target)!;

  const reward = (xp: number) => {
    const r = addXp(xp);
    sfx.correct();
    setBump((b) => b + 1);
    if (r.levelUp) { setTimeout(sfx.levelUp, 250); toast.success(`🏆 ${t("levelUp")} ${levelFromXp(s.xp + xp)}`); }
    else if (r.streakUp) { setTimeout(sfx.streak, 250); toast(`🔥 ${t("streakUp")}`); }
  };
  const fail = () => { loseHeart(); sfx.wrong(); };
  const go = (id: Tab) => { stopSpeaking(); setTab(id); };

  if (!loaded) return <div className="min-h-screen bg-background" />;

  // Remount feature screens when the language pair changes so everything reloads in the new languages.
  const langKey = `${s.native}-${s.target}`;

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-60">
      <Toaster position="top-center" />
      {(!s.configured || showSettings) && <Settings lingo={lingo} onClose={() => setShowSettings(false)} />}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-2 border-r-2 border-border bg-card p-4 md:flex">
        <h1 className="mb-6 px-2 text-3xl font-extrabold text-primary">LingoArena<span className="text-flame"> AI</span></h1>
        {TABS.map((x) => (
          <button key={x.id} onClick={() => go(x.id)} className={cn("flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-extrabold uppercase transition", tab === x.id ? "border-secondary bg-secondary/15 text-secondary" : "border-transparent text-muted-foreground hover:bg-muted")}>
            <x.icon className="h-6 w-6" />{t(x.key)}
          </button>
        ))}
        <button onClick={() => setShowSettings(true)} className="mt-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold uppercase text-muted-foreground hover:bg-muted"><SettingsIcon className="h-6 w-6" />{t("settings")}</button>
      </aside>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b-2 border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <select aria-label={t("nativeLang")} value={s.native} onChange={(e) => update({ native: e.target.value as NativeLang })}
              className="max-w-[7rem] rounded-xl border-2 border-border bg-card px-2 py-1.5 text-sm font-bold">
              {NATIVES.map((n) => <option key={n.id} value={n.id}>{langName(n.id, n.id)}</option>)}
            </select>
            <span className="text-muted-foreground">→</span>
            <select aria-label={t("targetLang")} value={s.target} onChange={(e) => update({ target: e.target.value as TargetLang })}
              className="max-w-[8rem] rounded-xl border-2 border-border bg-card px-2 py-1.5 text-sm font-bold">
              {TARGETS.filter((x) => x.id !== s.native).map((x) => <option key={x.id} value={x.id}>{x.flag} {langName(x.id, s.native)}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 font-extrabold sm:gap-5">
            <span className="flex items-center gap-1 text-flame" title={t("streak")}><Flame className="h-6 w-6 fill-current" />{s.streak}</span>
            <span key={bump} className="flex items-center gap-1 text-gem animate-pop" title="XP"><Gem className="h-6 w-6" />{s.xp}</span>
            <span className="flex items-center gap-1 text-heart" title={t("hearts")}><Heart className="h-6 w-6 fill-current" />{s.hearts}</span>
            <button onClick={() => update({ rate: s.rate === 1 ? 0.8 : 1 })} className="rounded-lg border-2 border-border px-2 py-0.5 text-xs" title={t("speed")}>{s.rate === 1 ? "1.0×" : "0.8×"}</button>
            <button aria-label={t("settings")} onClick={() => setShowSettings(true)} className="md:hidden"><SettingsIcon className="h-6 w-6 text-muted-foreground" /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="mb-4 text-sm font-bold text-muted-foreground">{t("learning")} {target.flag} {langName(s.target, s.native)} · {t("level")} {levelFromXp(s.xp)}</p>
        {tab === "learn" && <LearnPath key={langKey} lingo={lingo} reward={reward} fail={fail} />}
        {tab === "arena" && <SpeechArena key={langKey} lingo={lingo} reward={reward} fail={fail} />}
        {tab === "grammar" && <GrammarBattle key={langKey} lingo={lingo} reward={reward} fail={fail} />}
        {tab === "chat" && <FreeChat key={langKey} lingo={lingo} reward={reward} />}
        {tab === "stats" && <Stats lingo={lingo} />}
      </main>

      {/* Mobile nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t-2 border-border bg-card md:hidden">
        {TABS.map((x) => (
          <button key={x.id} onClick={() => go(x.id)} className={cn("flex flex-col items-center gap-1 py-2 text-[10px] font-extrabold uppercase", tab === x.id ? "text-secondary" : "text-muted-foreground")}>
            <x.icon className="h-6 w-6" /><span className="max-w-full truncate px-0.5">{t(x.key)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
