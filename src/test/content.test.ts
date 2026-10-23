import { describe, expect, it } from "vitest";
import { AUTHORED_UNIT_COUNT, CONCEPTS, NODES_PER_UNIT, CONCEPTS_PER_NODE, TARGETS, UNITS, nodeConcepts } from "@/lib/lingo/content";
import { S, UI_ORDER } from "@/lib/lingo/i18n";
import { compareSpeech, dictationCheck } from "@/lib/lingo/engine";
import { buildLessonExercises } from "@/components/lingo/LearnPath";
import { TURBO_LEVELS } from "@/components/lingo/SpeechArena";
import { FIRE_COMBO_LEVELS } from "@/components/lingo/FireCombo";

describe("lesson content", () => {
  it("never repeats a phrase across units or lessons, in any language", () => {
    for (const { id } of TARGETS) {
      const texts = CONCEPTS.map((c) => c.tr[id]);
      expect(new Set(texts).size, `duplicate phrase in ${id}`).toBe(texts.length);
    }
  });
  it("has complete translations for every concept", () => {
    for (const c of CONCEPTS) for (const { id } of TARGETS) expect(c.tr[id]?.trim(), `${c.id}/${id}`).toBeTruthy();
  });
  it("gives every authored lesson its own concepts", () => {
    // Units beyond AUTHORED_UNIT_COUNT use generated/adaptive practice, so only authored units are checked here.
    expect(AUTHORED_UNIT_COUNT).toBeGreaterThan(0);
    expect(AUTHORED_UNIT_COUNT).toBeLessThanOrEqual(UNITS.length);
    for (let u = 0; u < AUTHORED_UNIT_COUNT; u++)
      for (let n = 0; n < NODES_PER_UNIT; n++) expect(nodeConcepts(u, n)).toHaveLength(CONCEPTS_PER_NODE);
  });
});


describe("lesson exercise validation", () => {
  it("provides at least 10 unique prompts in every unit and lesson without API calls", () => {
    for (let unit = 0; unit < UNITS.length + 2; unit++) {
      for (let node = 0; node < NODES_PER_UNIT; node++) {
        const exercises = buildLessonExercises(unit, node, "en", "es");
        expect(exercises.length, `unit ${unit + 1}, lesson ${node + 1} needs at least 10 questions`).toBeGreaterThanOrEqual(10);
        const prompts = exercises.map((exercise) => exercise.prompt.trim().toLowerCase());
        expect(new Set(prompts).size, `duplicate prompts in unit ${unit + 1}, lesson ${node + 1}`).toBe(prompts.length);
        for (const exercise of exercises) {
          expect(exercise.options.length, `${exercise.id} needs at least five options`).toBeGreaterThanOrEqual(5);
          expect(new Set(exercise.options.map((option) => option.id)).size).toBe(exercise.options.length);
          expect(exercise.cefr).toMatch(/^(A1|A2|B1|B2|C1)$/);
          expect(exercise.difficulty).toBeGreaterThanOrEqual(1);
          expect(exercise.difficulty).toBeLessThanOrEqual(100);
          expect(exercise.skill).toBeTruthy();
          expect(exercise.topic).toBeTruthy();
        }
      }
    }
  });
  it("keeps every Turbo and Fire Combo level at ten or more questions", () => {
    for (const level of TURBO_LEVELS) expect(level.questions, `Turbo level ${level.level}`).toBeGreaterThanOrEqual(10);
    for (const level of FIRE_COMBO_LEVELS) expect(level.count, `Fire Combo level ${level.level}`).toBeGreaterThanOrEqual(10);
  });

});

describe("ui strings", () => {
  it("has a translation for each native language", () => {
    for (const [k, row] of Object.entries(S)) {
      expect(row, k).toHaveLength(UI_ORDER.length);
      row.forEach((v) => expect(v.trim(), k).toBeTruthy());
    }
  });
});

describe("speech comparison", () => {
  it("marks apostrophe words correctly (no shifted colors)", () => {
    const r = compareSpeech("L'addition, s'il vous plaît", "l addition s il vous plait", "fr");
    expect(r.words.every((w) => w.ok)).toBe(true);
    expect(r.score).toBe(100);
  });
  it("flags only the wrong word", () => {
    const r = compareSpeech("Quiero agua", "quiero pan", "es");
    expect(r.words.map((w) => w.ok)).toEqual([true, false]);
  });
  it("accepts accent/punctuation differences in dictation", () => {
    expect(dictationCheck("¿Dónde está la estación?", "donde esta la estacion", "es").exact).toBe(true);
  });
});
