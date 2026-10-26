import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, newlyUnlocked, progressFacts } from "@/lib/lingo/achievements";
import { sanitize, today } from "@/lib/lingo/store";
import { mergeStates } from "@/lib/lingo/sync";

describe("achievements", () => {
  it("unlocks from saved progress and only announces new ones", () => {
    const s = sanitize({ configured: true, native: "es", target: "en", streak: 7, xp: 1200, progress: { en: { done: [0, 1, 2], completed: 3 } } });
    const facts = progressFacts(s);
    expect(facts).toMatchObject({ lessons: 3, fullUnits: 1, languages: 1 });
    const fresh = newlyUnlocked(s);
    expect(fresh).toEqual(expect.arrayContaining(["first_lesson", "first_unit", "streak_3", "streak_7", "xp_1000"]));
    expect(fresh).not.toContain("lessons_10");
    expect(newlyUnlocked({ ...s, achievements: fresh })).toEqual([]);
  });
  it("has a title in every interface language", () => {
    for (const a of ACHIEVEMENTS) for (const title of a.title) expect(title.trim(), a.id).toBeTruthy();
  });
  it("counts days the daily goal was met", () => {
    const s = sanitize({ dailyGoal: 20, dailyXp: { "2026-10-01": 25, "2026-10-02": 5, "2026-10-03": 20 } });
    expect(progressFacts(s).goalDays).toBe(2);
  });
});

describe("daily XP bookkeeping", () => {
  it("keeps only valid days, the last 60, and a valid goal", () => {
    const many = Object.fromEntries(Array.from({ length: 70 }, (_, i) => [`2026-0${1 + Math.floor(i / 28)}-${String((i % 28) + 1).padStart(2, "0")}`, 10]));
    const s = sanitize({ dailyGoal: 999, dailyXp: { ...many, nonsense: 5 } });
    expect(s.dailyGoal).toBe(20);
    expect(Object.keys(s.dailyXp)).toHaveLength(60);
    expect(s.dailyXp.nonsense).toBeUndefined();
  });
  it("uses the local calendar date", () => {
    expect(today(new Date(2026, 9, 25, 23, 30))).toBe("2026-10-25");
  });
  it("merges per-day XP, counters and achievements across devices", () => {
    const a = sanitize({ dailyXp: { "2026-10-20": 30 }, reviewsDone: 4, chatTurns: 1, achievements: ["first_lesson"] });
    const b = sanitize({ dailyXp: { "2026-10-20": 10, "2026-10-21": 15 }, reviewsDone: 2, chatTurns: 9, achievements: ["streak_3"] });
    const m = mergeStates(a, b);
    expect(m.dailyXp).toEqual({ "2026-10-20": 30, "2026-10-21": 15 });
    expect(m).toMatchObject({ reviewsDone: 4, chatTurns: 9 });
    expect(m.achievements.sort()).toEqual(["first_lesson", "streak_3"]);
  });
});

import { nextStreak } from "@/lib/lingo/store";
describe("streak freeze", () => {
  it("continues on consecutive days and ignores repeat activity", () => {
    expect(nextStreak({ streak: 3, lastActive: "2026-10-10", streakFreezes: 0 }, "2026-10-11")).toMatchObject({ streak: 4, frozeDays: 0 });
    expect(nextStreak({ streak: 3, lastActive: "2026-10-11", streakFreezes: 0 }, "2026-10-11")).toMatchObject({ streak: 3, streakUp: false });
  });
  it("uses one freeze per missed day, else restarts", () => {
    expect(nextStreak({ streak: 5, lastActive: "2026-10-10", streakFreezes: 1 }, "2026-10-12")).toMatchObject({ streak: 6, streakFreezes: 0, frozeDays: 1 });
    expect(nextStreak({ streak: 5, lastActive: "2026-10-10", streakFreezes: 1 }, "2026-10-13")).toMatchObject({ streak: 1, streakFreezes: 1 });
    expect(nextStreak({ streak: 5, lastActive: null, streakFreezes: 2 }, "2026-10-13")).toMatchObject({ streak: 1 });
  });
  it("earns a freeze every 7 days, up to 2", () => {
    expect(nextStreak({ streak: 6, lastActive: "2026-10-10", streakFreezes: 0 }, "2026-10-11")).toMatchObject({ streak: 7, streakFreezes: 1 });
    expect(nextStreak({ streak: 13, lastActive: "2026-10-10", streakFreezes: 2 }, "2026-10-11")).toMatchObject({ streak: 14, streakFreezes: 2 });
  });
});
