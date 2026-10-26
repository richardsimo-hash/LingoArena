import { describe, expect, it } from "vitest";
import { mergeStates } from "@/lib/lingo/sync";
import { sanitize, type State } from "@/lib/lingo/store";

const base = (patch: Partial<State>): State => sanitize({ configured: true, native: "es", target: "en", ...patch });

describe("mergeStates (device + cloud)", () => {
  it("unites finished lessons and keeps the further-along review card", () => {
    const local = base({ progress: { en: { done: [0, 1], completed: 2, srs: { a: { box: 3, due: 10, lapses: 0 }, b: { box: 1, due: 5, lapses: 2 } }, sinceReview: 2 } } });
    const remote = base({ progress: { en: { done: [1, 4], completed: 2, srs: { a: { box: 2, due: 20, lapses: 1 }, c: { box: 5, due: 99, lapses: 0 } }, sinceReview: 1 } } });
    const merged = mergeStates(local, remote).progress.en!;
    expect(merged.done).toEqual([0, 1, 4]);
    expect(merged.completed).toBe(3);
    expect(merged.srs).toMatchObject({ a: { box: 3, due: 10, lapses: 1 }, b: { box: 1, due: 5, lapses: 2 }, c: { box: 5, due: 99, lapses: 0 } });
    expect(merged.sinceReview).toBe(2);
  });
  it("takes the highest scores and the streak of the most recently active device", () => {
    const local = base({ xp: 300, streak: 2, lastActive: "2026-10-20", bestPron: 90 });
    const remote = base({ xp: 120, streak: 7, lastActive: "2026-10-24", bestPron: 70 });
    const merged = mergeStates(local, remote);
    expect(merged).toMatchObject({ xp: 300, streak: 7, lastActive: "2026-10-24", bestPron: 90 });
  });
  it("uses the most recently changed settings, but never drops a name", () => {
    const local = base({ name: "", target: "fr", settingsAt: 200 });
    const remote = base({ name: "Ana", target: "de", settingsAt: 100 });
    const merged = mergeStates(local, remote);
    expect(merged.target).toBe("fr");
    expect(merged.name).toBe("Ana");
  });
  it("keeps languages the other side never studied", () => {
    const merged = mergeStates(base({ progress: { fr: { done: [3], completed: 1 } } }), base({ progress: { de: { done: [0], completed: 1 } } }));
    expect(Object.keys(merged.progress).sort()).toEqual(["de", "fr"]);
  });
});
