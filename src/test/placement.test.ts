import { describe, expect, it } from "vitest";
import { PASS_MARK, QUESTIONS_PER_LEVEL, placementQuestions, placementUnit } from "@/lib/lingo/placement";
import { CEFR_LEVELS, NODES_PER_UNIT } from "@/lib/lingo/content";
import { nextLesson } from "@/components/lingo/LearnPath";

describe("placement test", () => {
  it("draws 4 distinct questions per level from that level's units, each with the answer among 4 options", () => {
    for (const band of CEFR_LEVELS) {
      const qs = placementQuestions(band.level);
      expect(qs).toHaveLength(QUESTIONS_PER_LEVEL);
      expect(new Set(qs.map((q) => q.concept.id)).size).toBe(QUESTIONS_PER_LEVEL);
      for (const q of qs) {
        expect(q.concept.unit).toBeGreaterThanOrEqual(band.first);
        expect(q.concept.unit).toBeLessThanOrEqual(band.last);
        expect(q.options).toHaveLength(4);
        expect(q.options.some((o) => o.id === q.concept.id)).toBe(true);
      }
    }
  });
  it("places at the first level not passed", () => {
    expect(placementUnit([1])).toBe(CEFR_LEVELS[0]!.first); // failed A1 -> unit 1
    expect(placementUnit([PASS_MARK, 2])).toBe(CEFR_LEVELS[1]!.first); // passed A1 -> A2 start
    expect(placementUnit([4, 4, 3, 1])).toBe(CEFR_LEVELS[3]!.first); // passed to B1 -> B2 start
    expect(placementUnit([4, 4, 4, 4])).toBe(CEFR_LEVELS[3]!.first); // aced it -> still B2 start
  });
  it("makes Continue start from the placed unit, then fill earlier gaps", () => {
    const a2 = CEFR_LEVELS[1]!.first;
    expect(nextLesson([], a2)).toBe(a2 * NODES_PER_UNIT);
    expect(nextLesson([a2 * NODES_PER_UNIT], a2)).toBe(a2 * NODES_PER_UNIT + 1);
    const allFromA2 = Array.from({ length: (100 - a2) * NODES_PER_UNIT }, (_, i) => a2 * NODES_PER_UNIT + i);
    expect(nextLesson(allFromA2, a2)).toBe(0);
  });
});
