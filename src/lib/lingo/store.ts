import { useCallback, useEffect, useState } from "react";
import { NATIVES, NODES_PER_UNIT, PERSONAS, TARGETS, UNITS, nodeConcepts } from "./content";
import { dayNumber, grade, introduce, type Deck } from "./srs";
import type { NativeLang, PersonaId, TargetLang } from "./content";

/**
 * `done` holds the indexes of finished lessons (any order — nothing is locked).
 * `srs` is the Leitner deck of learned phrases; `sinceReview` counts lessons since the last review.
 */
export type LangProgress = { completed: number; done: number[]; srs?: Deck; sinceReview?: number; placedUnit?: number; placementSeen?: boolean };

const lessonConceptIds = (idx: number) => nodeConcepts(Math.floor(idx / NODES_PER_UNIT), idx % NODES_PER_UNIT).map((c) => c.id);
export type State = {
  configured: boolean;
  /** Learner's first name, asked on first use. Stored in this browser (and the account, if signed in). */
  name: string;
  /** When name/languages/persona/speed/theme last changed (ms); decides which device's settings win on sync. */
  settingsAt: number;
  native: NativeLang;
  target: TargetLang;
  persona: PersonaId;
  xp: number;
  hearts: number;
  heartsRefillAt: number | null;
  streak: number;
  lastActive: string | null;
  progress: Partial<Record<TargetLang, LangProgress>>;
  /** XP target per day (10/20/30/50). */
  dailyGoal: number;
  /** XP earned per local day, "YYYY-MM-DD" -> XP (last 60 days). */
  dailyXp: Record<string, number>;
  reviewsDone: number;
  /** Streak freezes held (max 2): each covers one missed day automatically. */
  streakFreezes: number;
  chatTurns: number;
  /** Opted in to the weekly leaderboard (shares first name + weekly XP). */
  leaderboardOptIn: boolean;
  /** Completed roleplay mission ids (see missions.ts). */
  missionsDone: string[];
  /** Unlocked achievement ids (see achievements.ts). */
  achievements: string[];
  rate: number;
  dark: boolean;
  bestPron: number;
  grammarWins: number;
  rapidBest: number;
};

export const MAX_HEARTS = Number.POSITIVE_INFINITY;
const MAX_TRACKED_NODES = 1000000;
const KEY = "lingoarena-v1";
const LEGACY_KEYS = ["lingo-arena-force-reset-v99", "lingo-arena-storage", "lingoarena"];
export const TOTAL_NODES = UNITS.length * NODES_PER_UNIT;

const DEFAULT: State = {
  configured: false, name: "", settingsAt: 0, native: "en", target: "es", persona: "barista",
  xp: 0, hearts: MAX_HEARTS, heartsRefillAt: null, streak: 0, lastActive: null,
  progress: {}, dailyGoal: 20, dailyXp: {}, reviewsDone: 0, streakFreezes: 1, chatTurns: 0, achievements: [], missionsDone: [], leaderboardOptIn: false, rate: 1, dark: false, bestPron: 0, grammarWins: 0, rapidBest: 0,
};

export const SETTINGS_KEYS = ["name", "native", "target", "persona", "rate", "dark", "dailyGoal", "leaderboardOptIn"] as const;
export const DAILY_GOALS = [10, 20, 30, 50];

export const MAX_FREEZES = 2;
/**
 * Streak update for activity today. Missed days are covered by freezes (one per day) if the
 * learner has enough; otherwise the streak restarts. A freeze is earned every 7 streak days.
 */
export function nextStreak(prev: { streak: number; lastActive: string | null; streakFreezes: number }, day: string) {
  if (prev.lastActive === day) return { streak: prev.streak, streakFreezes: prev.streakFreezes, streakUp: false, frozeDays: 0 };
  const gap = prev.lastActive ? dayDiff(prev.lastActive, day) : Infinity;
  let streak: number, freezes = prev.streakFreezes, frozeDays = 0;
  if (gap === 1) streak = prev.streak + 1;
  else if (gap > 1 && gap - 1 <= freezes) { frozeDays = gap - 1; freezes -= frozeDays; streak = prev.streak + 1; }
  else streak = 1;
  if (streak % 7 === 0) freezes = Math.min(MAX_FREEZES, freezes + 1);
  return { streak, streakFreezes: freezes, streakUp: true, frozeDays };
}

export const levelFromXp = (xp: number) => Math.floor(xp / 100) + 1;

/** Local calendar date "YYYY-MM-DD" (so the day and the daily goal roll over at the learner's midnight). */
export function today(date = new Date()) { return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); }
function dayDiff(a: string, b: string) { return Math.round((Date.parse(b) - Date.parse(a)) / 86400000); }

const isNative = (v: unknown): v is NativeLang => NATIVES.some((n) => n.id === v);
const isTarget = (v: unknown): v is TargetLang => TARGETS.some((t) => t.id === v);
const PERSONA_ALIASES: Record<string, PersonaId> = { "tour-guide": "guide", "tour_guide": "guide", sarcastic: "barista", strict: "gatekeeper" };
const isPersona = (v: unknown): v is PersonaId => PERSONAS.some((p) => p.id === v);
function parsePersona(v: unknown): PersonaId {
  if (isPersona(v)) return v;
  if (typeof v === "string" && PERSONA_ALIASES[v]) return PERSONA_ALIASES[v];
  return "barista";
}

/** Pick a native language from the browser when nothing is saved yet. */
export function detectNative(): NativeLang {
  if (typeof navigator === "undefined") return "en";
  for (const l of navigator.languages ?? [navigator.language]) {
    const p = l.slice(0, 2).toLowerCase();
    if (isNative(p)) return p;
  }
  return "en";
}
/** First sensible target that is not the native language. */
export function defaultTarget(native: NativeLang): TargetLang {
  const pref: TargetLang[] = native === "en" ? ["es", "fr", "de"] : ["en", "es", "fr"];
  return pref.find((t) => t !== native) ?? TARGETS.find((t) => t.id !== native)!.id;
}

function readSaved(): unknown {
  const fresh = localStorage.getItem(KEY);
  if (fresh) return JSON.parse(fresh);
  for (const k of LEGACY_KEYS) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> } & Record<string, unknown>;
    const st = (parsed.state && typeof parsed.state === "object" ? parsed.state : parsed) as Record<string, unknown>;
    return {
      configured: true,
      native: st.native ?? st.nativeLanguage,
      target: st.target ?? st.targetLanguage,
      persona: st.persona ?? st.selectedPersona,
      xp: st.xp,
      hearts: Number.POSITIVE_INFINITY,
      streak: st.streak,
      dark: st.dark,
    };
  }
  return null;
}

/** Validate + migrate whatever is in localStorage so languages are always consistent. */
export function sanitize(raw: unknown): State {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<State> & { progress?: Record<string, { completed?: number; done?: number[] }> };
  const native = isNative(r.native) ? r.native : detectNative();
  let target = isTarget(r.target) ? r.target : defaultTarget(native);
  if (target === native) target = defaultTarget(native);
  const progress: State["progress"] = {};
  for (const [lang, p] of Object.entries(r.progress ?? {})) {
    if (!isTarget(lang) || !p) continue;
    const done = Array.isArray(p.done)
      ? p.done.filter((n) => Number.isInteger(n) && n >= 0 && n < MAX_TRACKED_NODES)
      : Array.from({ length: Math.min(p.completed ?? 0, TOTAL_NODES) }, (_, i) => i); // old format
    const unique = [...new Set(done)];
    const rawDeck = (p as { srs?: unknown }).srs;
    let srs: Deck = {};
    if (rawDeck && typeof rawDeck === "object") {
      for (const [id, card] of Object.entries(rawDeck as Record<string, Partial<{ box: number; due: number; lapses: number }>>)) {
        if (card && [1, 2, 3, 4, 5].includes(Number(card.box)) && Number.isFinite(card.due)) srs[id] = { box: Number(card.box) as 1, due: Number(card.due), lapses: Number(card.lapses) || 0 };
      }
    }
    // Learners from before spaced review: their finished lessons become box-1 cards due today.
    const known = new Set(Object.keys(srs));
    const missing = unique.flatMap(lessonConceptIds).filter((id) => !known.has(id));
    if (missing.length) srs = introduce(srs, missing, dayNumber(), missing);
    const sinceReview = Number.isInteger((p as { sinceReview?: unknown }).sinceReview) ? Number((p as { sinceReview?: number }).sinceReview) : 0;
    const rawPlaced = Number((p as { placedUnit?: unknown }).placedUnit);
    const placedUnit = Number.isInteger(rawPlaced) && rawPlaced >= 0 && rawPlaced < UNITS.length ? rawPlaced : undefined;
    const placementSeen = Boolean((p as { placementSeen?: unknown }).placementSeen) || unique.length > 0;
    progress[lang] = { done: unique, completed: unique.length, srs, sinceReview, placedUnit, placementSeen };
  }
  const hearts = Number.POSITIVE_INFINITY;
  const persona = parsePersona((r as { persona?: unknown }).persona);
  const name = typeof r.name === "string" ? r.name.replace(/\s+/g, " ").trim().slice(0, 40) : "";
  const dailyGoal = DAILY_GOALS.includes(Number(r.dailyGoal)) ? Number(r.dailyGoal) : 20;
  const dailyXp: Record<string, number> = {};
  // Drop invalid entries first, then keep the 60 most recent days.
  const validDays = Object.entries(r.dailyXp && typeof r.dailyXp === "object" ? r.dailyXp : {})
    .filter(([day, xp]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Number(xp)))
    .sort(([a], [b]) => a.localeCompare(b)).slice(-60);
  for (const [day, xp] of validDays) dailyXp[day] = Math.max(0, Number(xp));
  const count = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : 0);
  const achievements = Array.isArray(r.achievements) ? [...new Set(r.achievements.filter((a): a is string => typeof a === "string"))] : [];
  return { ...DEFAULT, ...(r as Partial<State>), name, native, target, persona, hearts, progress, dailyGoal, dailyXp, reviewsDone: count(r.reviewsDone), chatTurns: count(r.chatTurns), achievements, leaderboardOptIn: r.leaderboardOptIn === true, missionsDone: Array.isArray(r.missionsDone) ? [...new Set(r.missionsDone.filter((m): m is string => typeof m === "string"))] : [], streakFreezes: r.streakFreezes === undefined ? 1 : Math.min(MAX_FREEZES, count(r.streakFreezes)) };
}

export function useLingo() {
  const [s, setS] = useState<State>(DEFAULT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const parsed = readSaved();
      if (parsed) setS(sanitize(parsed));
      else { const native = detectNative(); setS({ ...DEFAULT, native, target: defaultTarget(native) }); }
    } catch { setS(sanitize(null)); }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(s));
    document.documentElement.classList.toggle("dark", s.dark);
    document.documentElement.lang = s.native;
  }, [s, loaded]);


  /** Keeps native/target always different, whichever one the caller changes. */
  const update = useCallback((patch: Partial<State>) => setS((p) => {
    const next = { ...p, ...patch };
    if (SETTINGS_KEYS.some((k) => k in patch)) next.settingsAt = Date.now();
    if (next.target === next.native) {
      if (patch.native && !patch.target) next.target = defaultTarget(next.native);
      else if (patch.target && !patch.native) next.target = p.target;
      if (next.target === next.native) next.target = defaultTarget(next.native);
    }
    return next;
  }), []);

  const addXp = useCallback((n: number) => {
    const t = today();
    const { streak, streakFreezes, streakUp, frozeDays } = nextStreak(s, t);
    const levelUp = levelFromXp(s.xp + n) > levelFromXp(s.xp);
    const todayXp = s.dailyXp[t] ?? 0;
    const goalReached = todayXp < s.dailyGoal && todayXp + n >= s.dailyGoal;
    setS((p) => ({ ...p, xp: p.xp + n, streak, streakFreezes, lastActive: t, dailyXp: { ...p.dailyXp, [t]: (p.dailyXp[t] ?? 0) + n } }));
    return { levelUp, streakUp, goalReached, frozeDays };
  }, [s]);

  // Compatibility no-op: mistakes never consume lives or block learning.
  const loseHeart = useCallback(() => undefined, []);

  /** Finishing a lesson (new or repeated) adds its phrases to the review deck and counts toward the next review. */
  const completeNode = useCallback((idx: number, weak: string[] = []) => setS((p) => {
    const cur = p.progress[p.target] ?? { done: [], completed: 0 };
    const done = cur.done.includes(idx) ? cur.done : [...cur.done, idx];
    const srs = introduce(cur.srs ?? {}, lessonConceptIds(idx), dayNumber(), weak);
    return { ...p, progress: { ...p.progress, [p.target]: { ...cur, done, completed: done.length, srs, sinceReview: (cur.sinceReview ?? 0) + 1 } } };
  }), []);

  /** Applies a review's results (phrase id -> answered correctly) and resets the lesson counter. */
  const finishReview = useCallback((results: Record<string, boolean>) => setS((p) => {
    const cur = p.progress[p.target] ?? { done: [], completed: 0 };
    let srs = cur.srs ?? {};
    const today = dayNumber();
    for (const [id, correct] of Object.entries(results)) srs = grade(srs, id, correct, today);
    return { ...p, reviewsDone: p.reviewsDone + 1, progress: { ...p.progress, [p.target]: { ...cur, srs, sinceReview: 0 } } };
  }), []);

  /** Records a placement result (unit index to start from) or that the learner chose to start at zero. */
  const setPlacement = useCallback((placedUnit: number | undefined) => setS((p) => {
    const cur = p.progress[p.target] ?? { done: [], completed: 0 };
    return { ...p, progress: { ...p.progress, [p.target]: { ...cur, placedUnit, placementSeen: true } } };
  }), []);

  const completeMission = useCallback((id: string) => setS((p) => (p.missionsDone.includes(id) ? p : { ...p, missionsDone: [...p.missionsDone, id] })), []);
  const countChatTurn = useCallback(() => setS((p) => ({ ...p, chatTurns: p.chatTurns + 1 })), []);
  const unlockAchievements = useCallback((ids: string[]) => setS((p) => ({ ...p, achievements: [...new Set([...p.achievements, ...ids])] })), []);

  /** Replaces the whole state (after merging with the cloud copy). */
  const replace = useCallback((next: State) => setS(sanitize(next)), []);

  const reset = useCallback(() => { localStorage.removeItem(KEY); const native = detectNative(); setS({ ...DEFAULT, native, target: defaultTarget(native) }); }, []);

  const done = s.progress[s.target]?.done ?? [];
  const completed = done.length;
  const deck = s.progress[s.target]?.srs ?? {};
  const sinceReview = s.progress[s.target]?.sinceReview ?? 0;
  const placedUnit = s.progress[s.target]?.placedUnit;
  const placementSeen = s.progress[s.target]?.placementSeen ?? false;
  return { s, loaded, update, replace, addXp, loseHeart, completeNode, finishReview, setPlacement, completeMission, countChatTurn, unlockAchievements, reset, completed, done, deck, sinceReview, placedUnit, placementSeen };
}
export type Lingo = ReturnType<typeof useLingo>;
