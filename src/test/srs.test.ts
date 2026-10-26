import { describe, expect, it } from "vitest";
import { INTERVALS, deckStats, dueIds, grade, introduce, pickReview, type Deck } from "@/lib/lingo/srs";
import { buildReviewExercises } from "@/components/lingo/LearnPath";
import { CONCEPTS } from "@/lib/lingo/content";

const DAY = 20_000;

describe("Leitner schedule", () => {
  it("puts new phrases in box 1, due tomorrow; phrases missed in the lesson are due today", () => {
    const deck = introduce({}, ["a", "b"], DAY, ["b"]);
    expect(deck.a).toEqual({ box: 1, due: DAY + 1, lapses: 0 });
    expect(deck.b).toEqual({ box: 1, due: DAY, lapses: 0 });
    expect(dueIds(deck, DAY)).toEqual(["b"]);
  });
  it("does not reset progress when a lesson is repeated", () => {
    let deck = introduce({}, ["a"], DAY);
    deck = grade(deck, "a", true, DAY + 1); // box 2
    expect(introduce(deck, ["a"], DAY + 2).a!.box).toBe(2);
  });
  it("moves a phrase up one box per correct review with growing gaps, and back to box 1 on a miss", () => {
    let deck: Deck = introduce({}, ["a"], DAY);
    let day = DAY + 1;
    for (const box of [2, 3, 4, 5, 5] as const) {
      deck = grade(deck, "a", true, day);
      expect(deck.a!.box).toBe(box);
      expect(deck.a!.due).toBe(day + INTERVALS[box]);
      day = deck.a!.due;
    }
    deck = grade(deck, "a", false, day);
    expect(deck.a).toMatchObject({ box: 1, due: day, lapses: 1 });
  });
  it("reviews due phrases first (most overdue, lowest box), then tops up with the weakest", () => {
    const deck: Deck = {
      late: { box: 3, due: DAY - 5, lapses: 0 },
      dueWeak: { box: 1, due: DAY, lapses: 2 },
      future3: { box: 3, due: DAY + 3, lapses: 0 },
      future1: { box: 1, due: DAY + 1, lapses: 0 },
      mastered: { box: 5, due: DAY + 10, lapses: 0 },
    };
    expect(pickReview(deck, DAY, 4)).toEqual(["late", "dueWeak", "future1", "future3"]);
    expect(deckStats(deck, DAY)).toEqual({ learned: 5, due: 2, mastered: 1 });
  });
  it("returns an empty review for an empty deck", () => {
    expect(pickReview({}, DAY)).toEqual([]);
  });
});

describe("review exercises", () => {
  it("builds 10 exercises covering every chosen phrase, recall first", () => {
    const ids = CONCEPTS.slice(0, 6).map((c) => c.id);
    const exercises = buildReviewExercises(ids, "es", "en");
    expect(exercises).toHaveLength(10);
    expect(new Set(exercises.map((e) => e.concept.id))).toEqual(new Set(ids));
    const keys = exercises.map((e) => `${e.kind}:${e.concept.id}:${e.direction}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(exercises.filter((e) => e.kind === "choose").length).toBeLessThanOrEqual(3);
  });
  it("works with a single phrase and ignores unknown ids", () => {
    expect(buildReviewExercises([CONCEPTS[10]!.id, "nope"], "en", "ja").every((e) => e.concept.id === CONCEPTS[10]!.id)).toBe(true);
    expect(buildReviewExercises(["nope"], "en", "es")).toEqual([]);
  });
});
