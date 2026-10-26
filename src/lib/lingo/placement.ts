import { CEFR_LEVELS, CONCEPTS, type Cefr, type Concept } from "./content";
import { shuffle } from "./engine";

/**
 * Placement test: up to 4 questions per CEFR level, easiest first. A level is passed with
 * 3 of 4 correct; the test stops at the first level not passed. The learner is placed at the
 * start of the first level they did not pass (or at B2 if they passed everything).
 */
export const QUESTIONS_PER_LEVEL = 4;
export const PASS_MARK = 3;

export type PlacementQuestion = { level: Cefr; concept: Concept; options: Concept[] };

/** Questions for one level, drawn from across its units (not just the first ones). */
export function placementQuestions(level: Cefr): PlacementQuestion[] {
  const band = CEFR_LEVELS.find((b) => b.level === level)!;
  const pool = CONCEPTS.filter((c) => c.unit >= band.first && c.unit <= band.last);
  const picks = shuffle(pool).slice(0, QUESTIONS_PER_LEVEL);
  return picks.map((concept) => ({ level, concept, options: shuffle([concept, ...shuffle(pool.filter((c) => c.id !== concept.id)).slice(0, 3)]) }));
}

/** Unit index to start from, given the number correct per level in test order. */
export function placementUnit(correctByLevel: number[]): number {
  const passed = correctByLevel.findIndex((correct) => correct < PASS_MARK);
  const levelIndex = passed === -1 ? CEFR_LEVELS.length - 1 : passed;
  return CEFR_LEVELS[levelIndex]!.first;
}
