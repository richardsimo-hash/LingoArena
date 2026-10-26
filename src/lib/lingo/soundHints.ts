import { normalize } from "./engine";

/**
 * Sound-level pronunciation hints inferred from what speech recognition heard. For each expected
 * word that was not recognised, the closest heard word is compared against common confusions
 * (mostly for English, a few for Spanish). These are hints, not acoustic phoneme scoring.
 */
export type SoundHint = { expected: string; heard: string; kind: HintKind; detail?: string };
export type HintKind = "th" | "v_b" | "w_v" | "r_l" | "sh" | "long_short" | "ending_ed" | "ending_s" | "h_drop" | "rr" | "ending" | "sound";

function edit(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length]![b.length]!;
}

function classify(exp: string, got: string, lang: string): { kind: HintKind; detail?: string } {
  if (lang === "en") {
    if (exp.includes("th") && !got.includes("th")) {
      const sub = ["d", "t", "s", "f", "z"].find((c) => got === exp.replace(/th/g, c) || got.startsWith(exp.replace(/th/, c).slice(0, 2)));
      return { kind: "th", detail: sub };
    }
    if (exp.replace(/v/g, "b") === got || exp.replace(/b/g, "v") === got) return { kind: "v_b" };
    if (exp.replace(/w/g, "v") === got || exp.replace(/v/g, "w") === got) return { kind: "w_v" };
    if (exp.replace(/r/g, "l") === got || exp.replace(/l/g, "r") === got) return { kind: "r_l" };
    if (exp.includes("sh") && (exp.replace(/sh/g, "s") === got || exp.replace(/sh/g, "ch") === got)) return { kind: "sh" };
    if (/ee|ea/.test(exp) && exp.replace(/ee|ea/, "i") === got) return { kind: "long_short" };
    if (exp.includes("i") && (exp.replace("i", "ee") === got || exp.replace("i", "ea") === got)) return { kind: "long_short" };
    if (exp.endsWith("ed") && (got === exp.slice(0, -2) || got === exp.slice(0, -1))) return { kind: "ending_ed" };
    if (exp.endsWith("s") && got === exp.slice(0, -1)) return { kind: "ending_s" };
    if (exp.startsWith("h") && got === exp.slice(1)) return { kind: "h_drop" };
  }
  if (lang === "es") {
    if (exp.includes("rr") && got === exp.replace("rr", "r")) return { kind: "rr" };
  }
  if (got.length < exp.length && exp.startsWith(got)) return { kind: "ending" };
  return { kind: "sound" };
}

export function soundHints(target: string, heard: string, lang: string, max = 3): SoundHint[] {
  if (lang === "ja") return [];
  const words = (text: string) => text.toLowerCase().normalize("NFC").replace(/[¿?¡!.,;:«»“”"()]/g, " ").split(/\s+/).filter(Boolean);
  const exp = words(target), got = words(heard);
  const gotSet = new Set(got.map((w) => normalize(w)));
  const unused = got.filter((w) => !exp.some((e) => normalize(e) === normalize(w)));
  const hints: SoundHint[] = [];
  for (const e of exp) {
    if (gotSet.has(normalize(e)) || hints.length >= max) continue;
    // Closest heard word that is reasonably similar (otherwise the word was probably skipped).
    let best = "", bestDist = Infinity;
    for (const g of unused) { const d = edit(e, g); if (d < bestDist) { best = g; bestDist = d; } }
    if (!best || bestDist > Math.max(2, Math.ceil(e.length / 2))) continue;
    hints.push({ expected: e, heard: best, ...classify(e, best, lang) });
  }
  return hints;
}
