import { useState } from "react";
import { Flame, Gem, Settings as SettingsIcon, Map, Mic, Swords, BarChart3, MessageCircle, Zap } from "lucide-react";
import { toast, Toaster } from "sonner";
import { NATIVES, TARGETS, type NativeLang, type TargetLang } from "@/lib/lingo/content";
import { useLingo, levelFromXp } from "@/lib/lingo/store";
import { langName, makeT, type K } from "@/lib/lingo/i18n";
import { sfx, stopSpeaking, unlockAudio } from "@/lib/voice";
import { Settings } from "@/components/lingo/Settings";
import { AudioControls } from "@/components/lingo/ui";
import { LearnPath } from "@/components/lingo/LearnPath";
import { GrammarBattle } from "@/components/lingo/GrammarBattle";
import { SpeechArena } from "@/components/lingo/SpeechArena";
import { FreeChat } from "@/components/lingo/FreeChat";
import { FireCombo } from "@/components/lingo/FireCombo";
import { Stats } from "@/components/lingo/Stats";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "learn", key: "learn", icon: Map },
  { id: "arena", key: "arena", icon: Mic },
  { id: "grammar", key: "grammar", icon: Swords },
  { id: "fire", key: "rapid", icon: Zap },
  { id: "chat", key: "chat", icon: MessageCircle },
  { id: "stats", key: "stats", icon: BarChart3 },
] as const satisfies readonly { id: string; key: K; icon: unknown }[];
type Tab = (typeof TABS)[number]["id"];

export default function App() {
  const lingo = useLingo();
  const { s, loaded, update, addXp } = lingo;
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
  const fail = () => { sfx.wrong(); };
  const go = (id: Tab) => { void unlockAudio(); stopSpeaking(); setTab(id); };

  if (!loaded) return <div className="min-h-screen bg-background" />;

  // Remount feature screens when the language pair changes so everything reloads in the new languages.
  const langKey = `${s.native}-${s.target}`;

  return (
    <div onPointerDownCapture={() => { void unlockAudio(); }} onKeyDownCapture={() => { void unlockAudio(); }} className="min-h-dvh pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-60">
      <Toaster position="top-center" />
      {(!s.configured || showSettings) && <Settings lingo={lingo} onClose={() => setShowSettings(false)} />}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-2 border-r-2 border-border bg-card p-4 md:flex">
        <h1 className="mb-6 px-2 text-3xl font-extrabold text-primary">LingoArena<span className="text-flame"> AI</span></h1>
        {TABS.map((x) => (
          <button key={x.id} onClick={() => go(x.id)} className={cn("flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-extrabold uppercase transition", tab === x.id ? "border-secondary bg-secondary/15 text-secondary" : "border-transparent text-muted-foreground hover:bg-muted")}>
            <x.icon className="h-6 w-6" />{x.id === "fire" ? "Fire Combo" : t(x.key)}
          </button>
        ))}
        <button onClick={() => setShowSettings(true)} className="mt-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold uppercase text-muted-foreground hover:bg-muted"><SettingsIcon className="h-6 w-6" />{t("settings")}</button>
      </aside>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b-2 border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <select aria-label={t("nativeLang")} value={s.native} onChange={(e) => update({ native: e.target.value as NativeLang })}
              className="min-w-0 max-w-[42%] flex-1 rounded-xl border-2 border-border bg-card px-1.5 py-2 text-sm font-bold sm:max-w-[7rem] sm:flex-none sm:px-2">
              {NATIVES.map((n) => <option key={n.id} value={n.id}>{langName(n.id, n.id)}</option>)}
            </select>
            <span className="text-muted-foreground">→</span>
            <select aria-label={t("targetLang")} value={s.target} onChange={(e) => update({ target: e.target.value as TargetLang })}
              className="min-w-0 max-w-[48%] flex-1 rounded-xl border-2 border-border bg-card px-1.5 py-2 text-sm font-bold sm:max-w-[8rem] sm:flex-none sm:px-2">
              {TARGETS.filter((x) => x.id !== s.native).map((x) => <option key={x.id} value={x.id}>{x.flag} {langName(x.id, s.native)}</option>)}
            </select>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 font-extrabold sm:justify-end sm:gap-4">
            <span className="flex items-center gap-1 text-flame" title={t("streak")}><Flame className="h-5 w-5 shrink-0 fill-current sm:h-6 sm:w-6" />{s.streak}</span>
            <span key={bump} className="flex items-center gap-1 text-gem animate-pop" title="XP"><Gem className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />{s.xp}</span>
            <button onClick={() => update({ rate: s.rate === 1 ? 0.8 : 1 })} className="min-h-11 shrink-0 rounded-lg border-2 border-border px-2 py-1 text-xs" title={t("speed")}>{s.rate === 1 ? "1.0×" : "0.8×"}</button>
            <AudioControls />
            <button aria-label={t("settings")} onClick={() => setShowSettings(true)} className="min-h-11 min-w-11 shrink-0 rounded-lg p-2 md:hidden"><SettingsIcon className="h-6 w-6 text-muted-foreground" /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-3xl px-3 py-5 sm:px-4 sm:py-6">
        <p className="mb-4 text-sm font-bold text-muted-foreground">{t("learning")} {target.flag} {langName(s.target, s.native)} · {t("level")} {levelFromXp(s.xp)}</p>
        {tab === "learn" && <LearnPath key={langKey} lingo={lingo} reward={reward} fail={fail} />}
        {tab === "arena" && <SpeechArena key={langKey} lingo={lingo} reward={reward} fail={fail} />}
        {tab === "grammar" && <GrammarBattle key={langKey} lingo={lingo} reward={reward} fail={fail} />}
        {tab === "fire" && <FireCombo key={langKey} lingo={lingo} reward={reward} />}
        {tab === "chat" && <FreeChat key={langKey} lingo={lingo} reward={reward} />}
        {tab === "stats" && <Stats lingo={lingo} />}
      </main>

      {/* Mobile nav */}
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t-2 border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {TABS.map((x) => (
          <button key={x.id} aria-label={x.id === "learn" ? "Ruta" : x.id === "arena" ? "Arena de pronunciación" : x.id === "grammar" ? "Batalla gramatical" : x.id === "fire" ? "Fire Combo" : x.id === "chat" ? "Charla libre" : "Progreso"} onClick={() => go(x.id)} className={cn("flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 px-0 py-2 text-[10px] font-extrabold", tab === x.id ? "text-secondary" : "text-muted-foreground")}>
            <x.icon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" /><span className="mobile-nav-label max-w-full whitespace-nowrap px-0.5">{({ learn: "Ruta", arena: "Arena", grammar: "Batalla", fire: "Fire", chat: "Charla", stats: "Progreso" } as Record<string, string>)[x.id]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
