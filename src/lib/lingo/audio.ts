let ctx: AudioContext | null = null;
function ac() {
  if (typeof window === "undefined") return null;
  ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}
function tone(freqs: number[], step = 0.09, type: OscillatorType = "sine", vol = 0.15) {
  const c = ac();
  if (!c) return;
  freqs.forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    const t = c.currentTime + i * step;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + 0.32);
  });
}
export const sfx = {
  correct: () => tone([660, 880]),
  wrong: () => tone([220, 180], 0.12, "square", 0.06),
  streak: () => tone([523, 659, 784]),
  levelUp: () => tone([523, 659, 784, 1046], 0.1, "triangle"),
};

/* ---------------------------- Text-to-speech ---------------------------- */

const norm = (l: string) => l.replace("_", "-").toLowerCase();
const hasTTS = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** Voices load asynchronously (Chrome fires `voiceschanged`). Resolve once they exist. */
function getVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => { synth.removeEventListener("voiceschanged", done); resolve(synth.getVoices()); };
    synth.addEventListener("voiceschanged", done);
    setTimeout(done, 1200); // some browsers never fire the event
  });
}

/**
 * Pick the most natural voice for a locale:
 * only voices of the SAME language are considered, then ranked by
 *  - "Google" / "Natural" / "Neural" / "Online" / "Premium" / "Enhanced" tags (neural-quality)
 *  - exact locale match (es-ES, en-US, ...)
 *  - penalty for robotic engines (eSpeak, "Compact")
 */
export function pickVoice(locale: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const want = norm(locale), lang = want.slice(0, 2);
  let best: SpeechSynthesisVoice | null = null, bestScore = -Infinity;
  for (const v of voices) {
    const vl = norm(v.lang);
    if (!vl.startsWith(lang)) continue;
    let sc = 0;
    if (vl === want) sc += 4;
    if (/google/i.test(v.name)) sc += 6;
    if (/natural|neural/i.test(v.name)) sc += 7;
    if (/online|premium|enhanced|siri/i.test(v.name)) sc += 3;
    if (/espeak|compact/i.test(v.name)) sc -= 8;
    if (v.default) sc += 1;
    if (sc > bestScore) { best = v; bestScore = sc; }
  }
  return best;
}

let current = 0; // token so a newer call cancels older queued chunks
export function stopSpeaking() {
  if (!hasTTS()) return;
  current++;
  window.speechSynthesis.cancel();
}

/** Speak text with a natural voice. Long text is split by sentence (avoids Chrome cutting off long utterances). */
export function speak(text: string, locale: string, rate = 1, cb?: { onStart?: () => void; onEnd?: () => void }) {
  if (!hasTTS()) { cb?.onEnd?.(); return false; }
  const synth = window.speechSynthesis;
  synth.cancel();
  const token = ++current;
  const chunks = text.split(/(?<=[.!?。！？¿¡])\s+/).map((c) => c.trim()).filter(Boolean);
  if (!chunks.length) { cb?.onEnd?.(); return false; }

  getVoices().then((voices) => {
    if (token !== current) return;
    const voice = pickVoice(locale, voices);
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      u.lang = voice?.lang ?? locale;
      if (voice) u.voice = voice;
      u.rate = rate; u.pitch = 1;
      if (i === 0) u.onstart = () => token === current && cb?.onStart?.();
      if (i === chunks.length - 1) {
        u.onend = () => token === current && cb?.onEnd?.();
        u.onerror = () => token === current && cb?.onEnd?.();
      }
      synth.speak(u);
    });
  });
  return true;
}

/* ---------------------------- Speech recognition ---------------------------- */

export function getRecognition(): any | null {
  if (typeof window === "undefined") return null;
  const R = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return R ? new R() : null;
}
