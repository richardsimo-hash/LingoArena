import { describe, expect, it } from "vitest";
import { CONCEPTS, NODES_PER_UNIT, CONCEPTS_PER_NODE, TARGETS, UNITS, nodeConcepts } from "@/lib/lingo/content";
import { S, UI_ORDER } from "@/lib/lingo/i18n";
import { compareSpeech, dictationCheck } from "@/lib/lingo/engine";
import { buildLessonExercises } from "@/components/lingo/LearnPath";
import { TURBO_LEVELS } from "@/components/lingo/SpeechArena";
import { FIRE_COMBO_LEVELS } from "@/components/lingo/FireCombo";
import { shouldUseCloudChat } from "@/lib/lingo/chat.functions";

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
  it("gives every lesson its own concepts", () => {
    for (let u = 0; u < UNITS.length; u++)
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


describe("local-first AI routing", () => {
  it("keeps greetings and ordinary short turns local", () => {
    expect(shouldUseCloudChat("Hello Chloe")).toBe(false);
    expect(shouldUseCloudChat("I like coffee")).toBe(false);
    expect(shouldUseCloudChat("")).toBe(false);
  });
  it("routes explicit advanced tutoring requests to cloud AI", () => {
    expect(shouldUseCloudChat("Explain why this grammar is incorrect")).toBe(true);
    expect(shouldUseCloudChat("Compare although and despite")).toBe(true);
    expect(shouldUseCloudChat("Please correct my sentence")).toBe(true);
  });
  it("routes unusually long prompts to cloud AI", () => {
    expect(shouldUseCloudChat("Please help me practice. ".repeat(8))).toBe(true);
  });
});
