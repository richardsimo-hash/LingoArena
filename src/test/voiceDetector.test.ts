import { describe, expect, it } from "vitest";
import { createVoiceDetector } from "@/lib/liveCapture";

const BUFFER_MS = 85; // 4096 samples at 48 kHz
function feed(levels: number[], silenceMs = 1300) {
  const detector = createVoiceDetector({ silenceMs });
  let heardAt = -1, silenceAt = -1;
  levels.forEach((rms, i) => {
    const r = detector.push(rms, i * BUFFER_MS);
    if (r.heardVoice && heardAt < 0) heardAt = i;
    if (r.silenceAfterVoice && silenceAt < 0) silenceAt = i;
  });
  return { heardAt, silenceAt, detector };
}
const repeat = (rms: number, ms: number) => Array.from({ length: Math.round(ms / BUFFER_MS) }, () => rms);
// Speech with syllable dips, like the reported recording (peak ~0.23, avg ~0.03).
const speech = (ms: number) => Array.from({ length: Math.round(ms / BUFFER_MS) }, (_, i) => [0.05, 0.12, 0.23, 0.04, 0.015, 0.03][i % 6]!);

describe("createVoiceDetector", () => {
  it("detects speech that starts immediately (the reported bug)", () => {
    const { heardAt } = feed([...speech(2500), ...repeat(0.004, 1500)]);
    expect(heardAt).toBeGreaterThanOrEqual(0);
    expect(heardAt).toBeLessThan(5);
  });
  it("detects speech after a quiet start and ends after the pause", () => {
    const { heardAt, silenceAt } = feed([...repeat(0.005, 800), ...speech(2000), ...repeat(0.005, 2000)]);
    expect(heardAt).toBeGreaterThan(0);
    expect(silenceAt * BUFFER_MS).toBeGreaterThan(800 + 2000 + 1300 - BUFFER_MS);
  });
  it("does not end the turn during long continuous speech", () => {
    const { silenceAt } = feed(repeat(0.04, 6000));
    expect(silenceAt).toBe(-1);
  });
  it("ignores digital silence and a single click", () => {
    expect(feed(repeat(0, 3000)).heardAt).toBe(-1);
    expect(feed([...repeat(0.004, 1000), 0.3, ...repeat(0.004, 2000)]).heardAt).toBe(-1);
  });
  it("handles a noisy room without treating noise as speech", () => {
    expect(feed(repeat(0.015, 4000)).heardAt).toBe(-1);
  });
});
