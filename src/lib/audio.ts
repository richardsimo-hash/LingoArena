/** Shared mobile-safe audio/TTS manager. All playback reuses one persistent HTMLAudioElement. */
let ctx: AudioContext | null = null;
let player: HTMLAudioElement | null = null;
let mediaSource: MediaElementAudioSourceNode | null = null;
let audioAnalyser: AnalyserNode | null = null;
let amplitudeFrame = 0;
let unlocked = false;
let currentEngine = "none";
let lastTtsError = "";
let lastApiStatus = "not_checked";
let micState = "idle";
let muted = false;
let speakingToken = 0;
const ttsMemoryCache = new Map<string, string>();

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    return ctx;
  } catch (error) {
    console.warn("[LingoArena audio] AudioContext unavailable", error);
    return null;
  }
}

function persistentPlayer(): HTMLAudioElement | null {
  if (typeof document === "undefined") return null;
  if (!player) {
    player = document.createElement("audio");
    player.setAttribute("playsinline", "true");
    player.setAttribute("webkit-playsinline", "true");
    player.preload = "auto";
    player.autoplay = false;
    player.crossOrigin = "anonymous";
    player.style.display = "none";
    document.body.appendChild(player);
  }
  return player;
}

function emitAudioState() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("lingo-audio-state", { detail: { unlocked, muted, contextState: ctx?.state || "unavailable", currentEngine, lastTtsError, voicesCount: typeof speechSynthesis !== "undefined" ? speechSynthesis.getVoices().length : 0, micState, lastApiStatus } }));
}
export function getAudioDebugState() {
  return { unlocked, muted, contextState: ctx?.state || "unavailable", currentEngine, lastTtsError, voicesCount: typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis.getVoices().length : 0, micState, lastApiStatus };
}
export function setAudioMicState(value: string) { micState = value; emitAudioState(); }
export function setAudioApiStatus(value: string) { lastApiStatus = value; emitAudioState(); }
function setTtsDebug(engine: string, error = "", apiStatus = lastApiStatus) { currentEngine = engine; lastTtsError = error; lastApiStatus = apiStatus; emitAudioState(); }
const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
async function prepareForPlayback() {
  // Stop browser recognition/recording first. The listener releases microphone tracks.
  window.dispatchEvent(new CustomEvent("lingo-audio-will-play"));
  await sleep(350);
}

export function isAudioUnlocked() { return unlocked; }
export function isAudioMuted() { return muted; }
export function setAudioMuted(value: boolean) {
  muted = value;
  if (player) player.muted = value;
  if (value) stopSpeaking();
  emitAudioState();
}

/** Call synchronously from a user gesture (Start, Let's talk, or the speaker button). */
async function performUnlockAudio(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const c = audioContext();
    // Start all unlock operations synchronously within the originating tap before awaiting anything.
    const resumePromise = c?.state === "suspended" ? c.resume().catch(() => undefined) : Promise.resolve();
    if (c) {
      try {
        const buffer = c.createBuffer(1, 1, c.sampleRate);
        const source = c.createBufferSource();
        source.buffer = buffer; source.connect(c.destination); source.start(0);
      } catch (error) { console.info("[LingoArena audio] silent AudioContext prime failed", error); }
    }
    if ("speechSynthesis" in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(" ");
        utterance.volume = 0; window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance); window.speechSynthesis.cancel();
      } catch (error) { console.info("[LingoArena audio] speech synthesis unlock failed", error); }
    }
    const audio = persistentPlayer();
    let primePromise: Promise<unknown> = Promise.resolve();
    if (audio) {
      audio.muted = true;
      if (!audio.src) audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
      // Calling play now (before any await) preserves the iOS user-activation chain.
      try {
        primePromise = audio.play().then(() => { audio.pause(); try { audio.currentTime = 0; } catch { /* ignored */ } }).catch((error) => {
          console.info("[LingoArena audio] persistent player will retry after next tap", error);
        });
      } catch (error) { console.info("[LingoArena audio] persistent player prime failed", error); }
    }
    await Promise.allSettled([resumePromise, primePromise]);
    if (audio) audio.muted = muted;
    unlocked = !!audio || !!c;
    emitAudioState();
    return unlocked;
  } catch (error) {
    console.warn("[LingoArena audio] unlock failed", error);
    unlocked = false; emitAudioState(); return false;
  }
}

let unlockPromise: Promise<boolean> | null = null;
export function unlockAudio(): Promise<boolean> {
  if (unlocked) return Promise.resolve(true);
  if (unlockPromise) return unlockPromise;
  unlockPromise = performUnlockAudio().finally(() => { unlockPromise = null; });
  return unlockPromise;
}

function normalizeLocale(locale: string) { return locale.replace("_", "-").toLowerCase(); }
const ACCENT_KEY_PREFIX = "lingoarena-accent-";

export function setAccent(language: string, accent: string) {
  try { localStorage.setItem(`${ACCENT_KEY_PREFIX}${language}`, accent); } catch { /* storage may be unavailable */ }
}
export function getAccent(language: string): string {
  try { return localStorage.getItem(`${ACCENT_KEY_PREFIX}${language}`) || "auto"; } catch { return "auto"; }
}
export function resolveLocale(locale: string): string {
  const lang = locale.slice(0, 2).toLowerCase();
  const accent = getAccent(lang);
  if (accent === "auto") return locale;
  return accent;
}

function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  if (voices.length) return Promise.resolve(voices);
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      synth.removeEventListener("voiceschanged", done);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", done);
    window.setTimeout(done, 1500);
  });
}

export function pickVoice(locale: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const wanted = normalizeLocale(resolveLocale(locale));
  const lang = wanted.slice(0, 2);
  let best: SpeechSynthesisVoice | null = null;
  let score = -Infinity;
  for (const voice of voices) {
    const actual = normalizeLocale(voice.lang);
    if (!actual.startsWith(lang)) continue;
    let candidate = 0;
    if (actual === wanted) candidate += 8;
    else if (actual.split("-")[1] === wanted.split("-")[1]) candidate += 3;
    if (/natural|neural|online|premium|enhanced|siri/i.test(voice.name)) candidate += 4;
    if (/google/i.test(voice.name)) candidate += 2;
    if (/espeak|compact/i.test(voice.name)) candidate -= 5;
    if (voice.default) candidate += 1;
    if (candidate > score) { best = voice; score = candidate; }
  }
  return best;
}

function cacheKey(text: string, locale: string, rate: number) {
  const value = `${text}\u241f${resolveLocale(locale)}\u241f${rate}`;
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return `tts-${(hash >>> 0).toString(16)}`;
}
function idbGet(key: string): Promise<string | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open("lingoarena-audio-cache", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("tts");
    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const tx = request.result.transaction("tts", "readonly");
      const get = tx.objectStore("tts").get(key);
      get.onsuccess = () => resolve(typeof get.result === "string" ? get.result : null);
      get.onerror = () => resolve(null);
    };
  });
}
function idbPut(key: string, value: string): void {
  if (typeof indexedDB === "undefined") return;
  try {
    const request = indexedDB.open("lingoarena-audio-cache", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("tts");
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("tts", "readwrite");
      tx.objectStore("tts").put(value, key);
      tx.oncomplete = () => db.close();
    };
  } catch (error) { console.info("[LingoArena audio] cache write skipped", error); }
}

async function cloudTts(text: string, locale: string, rate: number): Promise<string | null> {
  const key = cacheKey(text, locale, rate);
  if (ttsMemoryCache.has(key)) return ttsMemoryCache.get(key)!;
  const cached = await idbGet(key);
  if (cached) { ttsMemoryCache.set(key, cached); return cached; }
  try {
    console.info("[LingoArena audio] TTS attempt", { engine: "cloud", locale: resolveLocale(locale), textLength: text.length });
    const response = await fetch("/api/tts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, locale: resolveLocale(locale), rate }),
    });
    lastApiStatus = String(response.status);
    if (!response.ok) {
      setTtsDebug("cloud_tts_failed", `HTTP ${response.status}`, String(response.status));
      console.info(`[LingoArena audio] cloud TTS fallback: HTTP ${response.status}`);
      return null;
    }
    const blob = await response.blob();
    if (!blob.size) return null;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    ttsMemoryCache.set(key, dataUrl);
    idbPut(key, dataUrl);
    return dataUrl;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    setTtsDebug("cloud_tts_failed", reason, "network_error");
    console.info("[LingoArena audio] cloud TTS unavailable; using browser speech synthesis", reason);
    return null;
  }
}

function stopAmplitudeTracking() {
  if (amplitudeFrame && typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(amplitudeFrame);
  amplitudeFrame = 0;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("lingo-audio-level", { detail: { level: 0 } }));
}
function startAmplitudeTracking(_audio: HTMLAudioElement) {
  // Deliberately avoid routing speech through MediaElementAudioSourceNode on iOS.
  // That can change the output route or result in silence on some Safari versions.
  if (typeof window !== "undefined") {
    let pulse = 0;
    const animate = () => {
      if (!player || player.paused || player.ended) { stopAmplitudeTracking(); return; }
      pulse = 0.08 + Math.abs(Math.sin(performance.now() / 105)) * 0.22;
      window.dispatchEvent(new CustomEvent("lingo-audio-level", { detail: { level: pulse } }));
      amplitudeFrame = requestAnimationFrame(animate);
    };
    stopAmplitudeTracking(); amplitudeFrame = requestAnimationFrame(animate);
  }
}

function playWithPersistentAudio(src: string, token: number, cb?: { onStart?: () => void; onEnd?: () => void }): Promise<boolean> {
  const audio = persistentPlayer();
  if (!audio || muted) { cb?.onEnd?.(); return Promise.resolve(false); }
  return new Promise((resolve) => {
    let started = false;
    const cleanup = () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
    const finishPlayback = (played: boolean) => {
      stopAmplitudeTracking(); cleanup();
      if (cancelCurrentPlayback === cancel) cancelCurrentPlayback = null;
      if (played && token === speakingToken) cb?.onEnd?.();
      resolve(played);
    };
    const cancel = () => finishPlayback(false);
    cancelCurrentPlayback = cancel;
    const onPlaying = () => { started = true; startAmplitudeTracking(audio); if (token === speakingToken) cb?.onStart?.(); };
    const onEnded = () => finishPlayback(true);
    const onError = () => finishPlayback(false);
    audio.pause();
    audio.currentTime = 0;
    audio.src = src;
    audio.muted = muted;
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    void prepareForPlayback().then(() => audio.play()).then(() => {
      setTtsDebug("cloud_tts", "", lastApiStatus);
      if (!started && token === speakingToken) cb?.onStart?.();
    }).catch((error) => {
      cleanup();
      setTtsDebug("cloud_playback_failed", error instanceof Error ? error.message : String(error), lastApiStatus);
      console.warn("[LingoArena audio] persistent audio playback failed; browser fallback will be tried", error);
      resolve(false);
    });
  });
}

let activeSpeechResolve: (() => void) | null = null;
let cancelCurrentPlayback: (() => void) | null = null;
function browserSpeak(text: string, locale: string, rate: number, token: number, cb?: { onStart?: () => void; onEnd?: () => void }): void {
  if (!("speechSynthesis" in window) || muted) { cb?.onEnd?.(); return; }
  setTtsDebug("browser_speech_synthesis", lastTtsError, lastApiStatus);
  const synth = window.speechSynthesis;
  synth.cancel();
  const chunks = text.match(/[^.!?。！？]+[.!?。！？]*/g)?.map((part) => part.trim()).filter(Boolean) ?? [text];
  const run = async () => {
    await prepareForPlayback();
    const voices = await waitForVoices();
    if (token !== speakingToken) return;
    const voice = pickVoice(locale, voices);
    let index = 0;
    const next = () => {
      if (token !== speakingToken) return;
      if (index >= chunks.length) { activeSpeechResolve = null; cb?.onEnd?.(); return; }
      const utterance = new SpeechSynthesisUtterance(chunks[index++]!);
      utterance.lang = voice?.lang ?? resolveLocale(locale);
      if (voice) utterance.voice = voice;
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = muted ? 0 : 1;
      utterance.onstart = () => { if (token === speakingToken) cb?.onStart?.(); };
      utterance.onend = next;
      utterance.onerror = (event) => {
        if (token !== speakingToken || event.error === "canceled" || event.error === "interrupted") return;
        console.warn("[LingoArena audio] browser TTS error", event.error);
        next();
      };
      synth.speak(utterance);
    };
    // Chrome can stall if queued utterances are added immediately after cancel.
    window.setTimeout(next, 40);
  };
  activeSpeechResolve = () => { synth.cancel(); };
  void run();
}

/** Cloud TTS first; speechSynthesis is a fallback. Must be invoked from a user action when possible. */
export function speak(text: string, locale: string, rate = 1, cb?: { onStart?: () => void; onEnd?: () => void }): boolean {
  if (typeof window === "undefined" || !text.trim()) { cb?.onEnd?.(); return false; }
  void unlockAudio(); // synchronously initiated by the button click before async TTS work
  const token = ++speakingToken;
  const clean = text.trim();
  if (muted) { cb?.onEnd?.(); return true; }
  void (async () => {
    // Ensure mobile Safari is not still in microphone capture mode before audio playback.
    // The gesture-unlocked persistent HTMLAudioElement is reused for all cloud clips.
    // Request one sentence at a time so the first spoken audio can begin sooner than a full-paragraph TTS call.
    const chunks = clean.match(/[^.!?。！？]+[.!?。！？]*/g)?.map((part) => part.trim()).filter(Boolean) ?? [clean];
    let started = false;
    const onStartOnce = () => { if (!started) { started = true; cb?.onStart?.(); } };
    for (let index = 0; index < chunks.length; index++) {
      const audio = await cloudTts(chunks[index]!, locale, rate);
      if (token !== speakingToken) return;
      if (!audio) {
        console.info("[LingoArena audio] browser speech fallback for remaining sentence chunks; reason:", lastTtsError || "cloud TTS unavailable");
        browserSpeak(chunks.slice(index).join(" "), locale, rate, token, { onStart: onStartOnce, onEnd: cb?.onEnd });
        return;
      }
      const played = await playWithPersistentAudio(audio, token, { onStart: onStartOnce });
      if (token !== speakingToken) return;
      if (!played) {
        console.info("[LingoArena audio] browser speech fallback after cloud playback failure");
        browserSpeak(chunks.slice(index).join(" "), locale, rate, token, { onStart: onStartOnce, onEnd: cb?.onEnd });
        return;
      }
    }
    if (token === speakingToken) cb?.onEnd?.();
  })();
  return true;
}

export function stopSpeaking() {
  speakingToken++;
  if (player) { player.pause(); try { player.currentTime = 0; } catch { /* ignored */ } }
  cancelCurrentPlayback?.(); cancelCurrentPlayback = null;
  stopAmplitudeTracking();
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  activeSpeechResolve?.();
  activeSpeechResolve = null;
}

function tone(freqs: number[], step = 0.09, type: OscillatorType = "sine", vol = 0.15) {
  const c = audioContext();
  if (!c || muted) return;
  if (c.state === "suspended") void c.resume();
  freqs.forEach((f, i) => {
    const oscillator = c.createOscillator(), gain = c.createGain();
    oscillator.type = type; oscillator.frequency.value = f;
    const at = c.currentTime + i * step;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(vol, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.3);
    oscillator.connect(gain).connect(c.destination);
    oscillator.start(at); oscillator.stop(at + 0.32);
  });
}
export const sfx = {
  correct: () => tone([660, 880]),
  wrong: () => tone([220, 180], 0.12, "square", 0.06),
  streak: () => tone([523, 659, 784]),
  levelUp: () => tone([523, 659, 784, 1046], 0.1, "triangle"),
};

export function getRecognition(): any | null {
  if (typeof window === "undefined") return null;
  const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return Recognition ? new Recognition() : null;
}

/** Upload recorded audio to the server-side STT route when Web Speech is unavailable. */
export async function transcribeAudio(blob: Blob, locale: string): Promise<string> {
  const audioBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  const response = await fetch("/api/stt", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, mimeType: blob.type || "audio/webm", locale: resolveLocale(locale) }),
  });
  setAudioApiStatus(`stt:${response.status}`);
  if (!response.ok) throw new Error(`STT_HTTP_${response.status}`);
  const result = await response.json() as { text?: string };
  if (!result.text?.trim()) throw new Error("STT_EMPTY");
  return result.text.trim();
}

// iOS Safari may suspend audio after tab switches, screen lock, or an incoming call.
if (typeof window !== "undefined") {
  const recoverAudio = () => {
    unlocked = false;
    emitAudioState();
    if (ctx?.state === "suspended" || (ctx?.state as string | undefined) === "interrupted") {
      void ctx.resume().then(() => { unlocked = true; emitAudioState(); }).catch(() => { unlocked = false; emitAudioState(); });
    } else {
      // Re-prime the persistent player on return; if iOS requires a gesture, the banner remains visible.
      void unlockAudio();
    }
  };
  window.addEventListener("pageshow", recoverAudio);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") recoverAudio(); });
}
