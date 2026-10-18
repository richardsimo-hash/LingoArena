import { describe, expect, it } from "vitest";
import { CONCEPTS, NODES_PER_UNIT, CONCEPTS_PER_NODE, TARGETS, UNITS, nodeConcepts } from "@/lib/lingo/content";
import { S, UI_ORDER } from "@/lib/lingo/i18n";
import { compareSpeech, dictationCheck } from "@/lib/lingo/engine";

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
