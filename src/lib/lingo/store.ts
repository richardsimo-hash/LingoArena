import { useCallback, useEffect, useState } from "react";
import { NATIVES, NODES_PER_UNIT, PERSONAS, TARGETS, UNITS } from "./content";
import type { NativeLang, PersonaId, TargetLang } from "./content";

/** `done` holds the indexes of finished lessons (any order — nothing is locked). */
export type LangProgress = { completed: number; done: number[] };
export type State = {
  configured: boolean;
  native: NativeLang;
  target: TargetLang;
  persona: PersonaId;
  xp: number;
  hearts: number;
  heartsRefillAt: number | null;
  streak: number;
  lastActive: string | null;
  progress: Partial<Record<TargetLang, LangProgress>>;
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
  configured: false, native: "en", target: "es", persona: "barista",
  xp: 0, hearts: MAX_HEARTS, heartsRefillAt: null, streak: 0, lastActive: null,
  progress: {}, rate: 1, dark: false, bestPron: 0, grammarWins: 0, rapidBest: 0,
};

export const levelFromXp = (xp: number) => Math.floor(xp / 100) + 1;

function today() { return new Date().toISOString().slice(0, 10); }
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
function sanitize(raw: unknown): State {
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
    progress[lang] = { done: [...new Set(done)], completed: new Set(done).size };
  }
  const hearts = Number.POSITIVE_INFINITY;
  const persona = parsePersona((r as { persona?: unknown }).persona);
  return { ...DEFAULT, ...(r as Partial<State>), native, target, persona, hearts, progress };
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
    if (next.target === next.native) {
      if (patch.native && !patch.target) next.target = defaultTarget(next.native);
      else if (patch.target && !patch.native) next.target = p.target;
      if (next.target === next.native) next.target = defaultTarget(next.native);
    }
    return next;
  }), []);

  const addXp = useCallback((n: number) => {
    const t = today();
    const streakUp = s.lastActive !== t;
    const streak = streakUp ? (s.lastActive && dayDiff(s.lastActive, t) === 1 ? s.streak + 1 : 1) : s.streak;
    const levelUp = levelFromXp(s.xp + n) > levelFromXp(s.xp);
    setS((p) => ({ ...p, xp: p.xp + n, streak, lastActive: t }));
    return { levelUp, streakUp };
  }, [s]);

  // Compatibility no-op: mistakes never consume lives or block learning.
  const loseHeart = useCallback(() => undefined, []);

  const completeNode = useCallback((idx: number) => setS((p) => {
    const cur = p.progress[p.target]?.done ?? [];
    if (cur.includes(idx)) return p;
    const done = [...cur, idx];
    return { ...p, progress: { ...p.progress, [p.target]: { done, completed: done.length } } };
  }), []);

  const reset = useCallback(() => { localStorage.removeItem(KEY); const native = detectNative(); setS({ ...DEFAULT, native, target: defaultTarget(native) }); }, []);

  const done = s.progress[s.target]?.done ?? [];
  const completed = done.length;
  return { s, loaded, update, addXp, loseHeart, completeNode, reset, completed, done };
}
export type Lingo = ReturnType<typeof useLingo>;
