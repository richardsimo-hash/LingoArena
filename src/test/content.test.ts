import { describe, expect, it } from "vitest";
import { CONCEPTS, NODES_PER_UNIT, CONCEPTS_PER_NODE, TARGETS, UNITS, nodeConcepts, practiceConcepts } from "@/lib/lingo/content";
import { S, UI_ORDER, unitTitle } from "@/lib/lingo/i18n";
import { compareSpeech, dictationCheck } from "@/lib/lingo/engine";
import { buildLessonExercises, fillBlank, nextLesson } from "@/components/lingo/LearnPath";
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
  it("has exactly 100 units in CEFR order (A1 -> A2 -> B1 -> B2)", () => {
    expect(UNITS).toHaveLength(100);
    const order = ["A1", "A2", "B1", "B2"];
    for (let i = 1; i < UNITS.length; i++) expect(order.indexOf(UNITS[i]!.level), `unit ${i + 1}`).toBeGreaterThanOrEqual(order.indexOf(UNITS[i - 1]!.level));
    for (const level of order) expect(UNITS.some((u) => u.level === level), level).toBe(true);
  });
  it("gives every unit a title in every interface language", () => {
    for (let u = 0; u < UNITS.length; u++) for (const native of UI_ORDER) expect(unitTitle(u, native).trim(), `unit ${u + 1}/${native}`).toBeTruthy();
  });
  it("gives every lesson its own concepts", () => {
    for (let u = 0; u < UNITS.length; u++)
      for (let n = 0; n < NODES_PER_UNIT; n++) expect(nodeConcepts(u, n)).toHaveLength(CONCEPTS_PER_NODE);
  });
});


describe("lesson exercise validation", () => {
  it("builds 10 distinct exercises for every lesson of all 100 units", () => {
    for (let unit = 0; unit < UNITS.length; unit++) {
      for (let node = 0; node < NODES_PER_UNIT; node++) {
        const exercises = buildLessonExercises(unit, node, "es", "en");
        expect(exercises.length, `unit ${unit + 1}, lesson ${node + 1}`).toBe(10);
        const keys = exercises.map((e) => `${e.kind}:${e.concept.id}:${e.direction}`);
        expect(new Set(keys).size, `repeated exercise in unit ${unit + 1}, lesson ${node + 1}`).toBe(keys.length);
        expect(exercises.some((e) => e.prompt.match(/challenge \d/i)), "prompts must not carry pre-shuffle numbers").toBe(false);
      }
    }
  });
  it("only creates fill-ins with a real blank and visible context, for every language pair", () => {
    for (const { id: target } of TARGETS) for (const native of UI_ORDER) {
      if (native === target) continue;
      for (let unit = 0; unit < UNITS.length; unit++) for (let node = 0; node < NODES_PER_UNIT; node++) {
        for (const e of buildLessonExercises(unit, node, native, target)) {
          if (e.kind !== "fill") continue;
          const where = `${target}/${native} unit ${unit + 1} lesson ${node + 1}: ${e.concept.tr[target]}`;
          expect(e.display, where).toContain("_____");
          expect(e.display!.replace("_____", "").replace(/[^\p{L}]/gu, "").length, `${where} has no visible words`).toBeGreaterThan(0);
          expect(e.answer.length, where).toBeGreaterThan(1);
          expect(e.display, `${where} shows the answer`).not.toContain(e.answer + " ");
          expect(e.prompt, `${where} needs the meaning as a hint`).toContain(e.concept.tr[native]);
        }
      }
    }
  });
  it("never makes a fill-in from one-word or unspaced phrases", () => {
    expect(fillBlank("Hello")).toBeNull();
    expect(fillBlank("こんにちは")).toBeNull();
    expect(fillBlank("Good morning")).toEqual({ display: "Good _____", answer: "morning" });
    expect(fillBlank("¿Dónde está la estación?")).toEqual({ display: "¿Dónde está la _____?", answer: "estación" });
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

describe("learning path progression", () => {
  it("recommends the first unfinished lesson, even when lessons were done out of order", () => {
    expect(nextLesson([])).toBe(0);
    expect(nextLesson([0, 1, 2, 4])).toBe(3);
    expect(nextLesson(Array.from({ length: UNITS.length * NODES_PER_UNIT }, (_, i) => i))).toBe(0);
  });
  it("keeps practice modes to units the learner has reached", () => {
    const beginner = practiceConcepts([]);
    expect(Math.max(...beginner.map((c) => c.unit))).toBe(4); // units 1-5
    const midway = practiceConcepts([60 * NODES_PER_UNIT]); // finished a lesson in unit 61
    expect(Math.max(...midway.map((c) => c.unit))).toBe(62);
    expect(practiceConcepts([299]).length).toBe(CONCEPTS.length);
  });
});
