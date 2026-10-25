import type { TargetLang } from "./content";

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/['’`]/g, " ")
    .replace(/[¿?¡!.,;:。、！？「」"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(s: string, lang: TargetLang): string[] {
  const n = normalize(s);
  if (lang === "ja") return Array.from(n.replace(/\s/g, ""));
  return n ? n.split(" ") : [];
}

export type WordResult = { w: string; ok: boolean };
export type SpeechCompare = { words: WordResult[]; score: number; exact: boolean };

/**
 * Compare what the user said/typed with the target phrase.
 * Display units are the ORIGINAL words ("l'addition", "¿Dónde"), and each unit owns the
 * normalized tokens it produces, so apostrophes/punctuation can no longer shift the
 * green/red marks onto the wrong words. A word is green only if ALL its tokens matched.
 */
export function compareSpeech(target: string, spoken: string, lang: TargetLang): SpeechCompare {
  const units = lang === "ja" ? Array.from(target) : target.split(/\s+/).filter(Boolean);
  const flat: { tok: string; unit: number }[] = [];
  units.forEach((u, ui) => tokens(u, lang).forEach((tok) => flat.push({ tok, unit: ui })));
  const a = flat.map((f) => f.tok);
  const b = tokens(spoken, lang);

  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i]![j] = a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);

  const hit = new Array<boolean>(a.length).fill(false);
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { hit[i] = true; i++; j++; }
    else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) i++;
    else j++;
  }

  const unitOk = units.map(() => true);
  flat.forEach((f, k) => { if (!hit[k]) unitOk[f.unit] = false; });
  const hits = hit.filter(Boolean).length;
  const score = a.length ? Math.round((hits / a.length) * 100) : 0;
  return {
    words: units.map((w, k) => ({ w, ok: unitOk[k]! })),
    score,
    exact: a.length > 0 && hits === a.length && b.length === a.length,
  };
}

export type DictationResult = SpeechCompare & { missing: string[]; extra: string[] };

/** Listening mode: the bot said `target`, the learner wrote/said `input`. */
export function dictationCheck(target: string, input: string, lang: TargetLang): DictationResult {
  const cmp = compareSpeech(target, input, lang);
  const targetToks = new Set(tokens(target, lang));
  return {
    ...cmp,
    missing: cmp.words.filter((w) => !w.ok).map((w) => w.w),
    extra: tokens(input, lang).filter((t) => !targetToks.has(t)),
  };
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

/** Endless, non-repeating deck: reshuffles only after every item has been used. */
export function makeDeck<T>(items: T[]) {
  let pile: T[] = [];
  let last: T | undefined;
  return () => {
    if (!pile.length) { pile = shuffle(items); if (pile.length > 1 && pile[0] === last) pile.push(pile.shift()!); }
    last = pile.shift()!;
    return last;
  };
}
