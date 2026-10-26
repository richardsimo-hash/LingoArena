import { describe, expect, it } from "vitest";
import { soundHints } from "@/lib/lingo/soundHints";

describe("sound hints", () => {
  it("spots common English sound confusions", () => {
    expect(soundHints("Is this the right one?", "Is dis de right one", "en").map((h) => h.kind)).toEqual(["th", "th"]);
    expect(soundHints("I have a very big van", "I have a bery big ban", "en").map((h) => h.kind)).toEqual(["v_b", "v_b"]);
    expect(soundHints("I walked home", "I walk home", "en")[0]).toMatchObject({ expected: "walked", heard: "walk", kind: "ending_ed" });
    expect(soundHints("Take a seat", "Take a sit", "en")[0]?.kind).toBe("long_short");
    expect(soundHints("Hello, how are you?", "ello how are you", "en")[0]?.kind).toBe("h_drop");
  });
  it("covers Spanish rr and ignores correct words, accent-only differences and skipped words", () => {
    expect(soundHints("El perro es pequeño", "el pero es pequeno", "es").map((h) => h.kind)).toEqual(["rr"]);
    expect(soundHints("Thank you very much", "thank you very much", "en")).toEqual([]);
    expect(soundHints("I would like some water", "water", "en")).toEqual([]);
  });
});
