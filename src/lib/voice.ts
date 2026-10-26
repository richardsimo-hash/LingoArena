import { createDiagnosticId, getDiagnosticEvents, logDiagnostic } from "@/lib/diagnostics";
import { transcribeLocally, transcribePcm } from "@/lib/localWhisper";
import { encodeWav } from "@/lib/liveCapture";

/** Shared mobile-safe audio/TTS manager. All playback reuses one persistent HTMLAudioElement. */
let ctx: AudioContext | null = null;
let player: HTMLAudioElement | null = null;
let chimed = false; // the "sound enabled" chime plays once per page, not after every tab switch
let audioAnalyser: AnalyserNode | null = null;
let amplitudeFrame = 0;
let unlocked = false;
let currentEngine = "none";
let lastTtsError = "";
let lastApiStatus = "not_checked";
// Avoid repeatedly hitting Gemini after a provider-side 429; browser speech remains available.
let cloudTtsCooldownUntil = 0;
let micState = "idle";
let muted = false;
let speakingToken = 0;
let unlockError = "";
const debugLogs: string[] = [];
// Safari may collect utterances that are not strongly referenced while speaking.
const activeUtterances: SpeechSynthesisUtterance[] = [];

function retainUtterance(utterance: SpeechSynthesisUtterance) {
  activeUtterances.push(utterance);
}

function releaseUtterance(utterance: SpeechSynthesisUtterance) {
  const index = activeUtterances.indexOf(utterance);
  if (index >= 0) activeUtterances.splice(index, 1);
}

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) { ctx = new Ctor(); if (getPreferredSpeakerId()) applySpeaker(ctx as unknown as SinkCapable); }
    return ctx;
  } catch (error) {
    console.warn("[LingoArena audio] AudioContext unavailable", error);
    return null;
  }
}

const SPEAKER_KEY = "lingoarena-speaker-device";
type SinkCapable = { setSinkId?: (id: string) => Promise<void> };
export function getPreferredSpeakerId(): string {
  try { return localStorage.getItem(SPEAKER_KEY) || ""; } catch { return ""; }
}
/** True when this browser can route app audio to a chosen output device (Chrome/Edge). */
export function canChooseSpeaker(): boolean {
  return typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;
}
function applySpeaker(target: SinkCapable | null | undefined, id = getPreferredSpeakerId()) {
  if (!target?.setSinkId) return;
  void target.setSinkId(id).catch((error) => logAudio("setSinkId failed", error));
}
/** Routes the app's audio player and sound effects; browser speech synthesis always uses the system output. */
export function setPreferredSpeakerId(id: string) {
  try { if (id) localStorage.setItem(SPEAKER_KEY, id); else localStorage.removeItem(SPEAKER_KEY); } catch { /* storage may be disabled */ }
  applySpeaker(player as SinkCapable | null, id);
  applySpeaker(ctx as unknown as SinkCapable | null, id);
}

function persistentPlayer(): HTMLAudioElement | null {
  if (typeof document === "undefined") return null;
  if (!player) {
    player = document.createElement("audio");
    player.setAttribute("playsinline", "true");
    player.setAttribute("webkit-playsinline", "true");
    player.preload = "auto";
    player.autoplay = false;
    // Do not use display:none: iOS Safari can refuse to start media on a fully hidden element.
    player.style.position = "fixed";
    player.style.width = "1px"; player.style.height = "1px";
    player.style.opacity = "0.01"; player.style.pointerEvents = "none";
    player.style.left = "-10px"; player.style.bottom = "0";
    player.setAttribute("aria-hidden", "true");
    document.body.appendChild(player);
    if (getPreferredSpeakerId()) applySpeaker(player as SinkCapable);
  }
  return player;
}

function logAudio(message: string, detail?: unknown) {
  const line = `${new Date().toLocaleTimeString()} ${message}${detail === undefined ? "" : `: ${detail instanceof Error ? `${detail.name}: ${detail.message}` : String(detail)}`}`;
  debugLogs.push(line); if (debugLogs.length > 20) debugLogs.shift();
  console.info("[LingoArena audio]", message, detail ?? "");
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("lingo-audio-log", { detail: line }));
}
function audioSessionType(): string {
  try { return String((navigator as Navigator & { audioSession?: { type?: string } }).audioSession?.type || "unavailable"); } catch { return "unavailable"; }
}
function emitAudioState() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("lingo-audio-state", { detail: getAudioDebugState() }));
}
export function getAudioDebugState() {
  return { diagnosticEvents: getDiagnosticEvents().slice(-40), unlocked, muted, contextState: ctx?.state || "unavailable", currentEngine, lastTtsError, unlockError, voicesCount: typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis.getVoices().length : 0, micState, lastApiStatus, audioSessionType: audioSessionType(), userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unavailable", logs: [...debugLogs] };
}
export function setAudioMicState(value: string) { micState = value; emitAudioState(); }
export function setAudioApiStatus(value: string) { lastApiStatus = value; emitAudioState(); }
function setTtsDebug(engine: string, error = "", apiStatus = lastApiStatus) { currentEngine = engine; lastTtsError = error; lastApiStatus = apiStatus; if (error) logAudio(`${engine} error`, error); else logAudio(`${engine} selected`, apiStatus); emitAudioState(); }
const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
async function prepareForPlayback() {
  // Ask every active capture component to stop recognition and release tracks.
  let released = false;
  const releaseWait = new Promise<void>((resolve) => {
    const done = () => { if (released) return; released = true; window.removeEventListener("lingo-audio-mic-released", done); resolve(); };
    window.addEventListener("lingo-audio-mic-released", done, { once: true });
    window.setTimeout(done, 700); // no active microphone listener is also a valid case
  });
  window.dispatchEvent(new CustomEvent("lingo-audio-will-play"));
  await releaseWait;
  // iOS audio-session routing needs a small settling interval after recording ends.
  await sleep(300);
}


export function isIOSWebKit(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isAudioUnlocked() { return unlocked; }
export function isAudioMuted() { return muted; }
export function setAudioMuted(value: boolean) {
  muted = value;
  if (player) player.muted = value;
  if (value) stopSpeaking();
  emitAudioState();
}

/** A valid 100 ms PCM WAV is generated locally; no network or await before audio.play(). */
function wavDataUri(frequency = 0, durationMs = 100): string {
  const sampleRate = 24000; const count = Math.max(1, Math.floor(sampleRate * durationMs / 1000));
  const bytes = new Uint8Array(44 + count * 2); const view = new DataView(bytes.buffer);
  const write = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) bytes[offset + i] = value.charCodeAt(i); };
  write(0, "RIFF"); view.setUint32(4, 36 + count * 2, true); write(8, "WAVE"); write(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, "data"); view.setUint32(40, count * 2, true);
  for (let i = 0; i < count; i++) view.setInt16(44 + i * 2, frequency ? Math.round(4200 * Math.sin(2 * Math.PI * frequency * i / sampleRate)) : 0, true);
  let binary = ""; for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 0x8000, bytes.length)));
  return `data:audio/wav;base64,${btoa(binary)}`;
}

async function playLocalBeep(frequency = 660, durationMs = 180): Promise<void> {
  const audio = persistentPlayer();
  if (!audio) throw new Error("persistent_audio_element_unavailable");
  const beepSrc = wavDataUri(frequency, durationMs);
  audio.pause(); audio.muted = muted; audio.src = beepSrc; audio.load();
  const playing = new Promise<void>((resolve, reject) => {
    let settled = false;
    const cleanup = () => { audio.removeEventListener("ended", onEnd); audio.removeEventListener("error", onError); audio.removeEventListener("playing", onPlaying); window.clearTimeout(timer); };
    const finish = (error?: Error) => { if (settled) return; settled = true; cleanup(); error ? reject(error) : resolve(); };
    let started = false;
    const onPlaying = () => { started = true; };
    const onEnd = () => finish();
    const onError = () => finish(new Error(audio.error ? `MediaError ${audio.error.code}: ${audio.error.message}` : "audio_element_error"));
    // If the beep started and was then paused (speech or the mic took over), that is not a failure.
    const timer = window.setTimeout(() => { if (!audio.paused) { audio.pause(); finish(); } else if (started || audio.src !== beepSrc) finish(); else finish(new Error("beep_playback_timeout")); }, Math.max(1500, durationMs + 1200));
    audio.addEventListener("playing", onPlaying, { once: true });
    audio.addEventListener("ended", onEnd, { once: true }); audio.addEventListener("error", onError, { once: true });
  });
  try { await audio.play(); await playing; }
  catch (error) {
    // play() rejects with AbortError when speech or the mic pauses the beep first; that is expected.
    if (error instanceof Error && error.name === "AbortError") return;
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error); setTtsDebug("local_beep_failed", message, "local"); throw error;
  }
}

/** Call directly from a real user gesture. The first media play is started synchronously. */
async function performUnlockAudio(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  unlocked = false; unlockError = ""; emitAudioState();
  const audio = persistentPlayer();
  let playPromise: Promise<void> | null = null;
  let startedPromise: Promise<boolean> = Promise.resolve(false);
  try {
    const session = (navigator as Navigator & { audioSession?: { type?: string } }).audioSession;
    if (session && "type" in session) { try { session.type = "playback"; } catch (error) { logAudio("audioSession playback mode unavailable", error); } }
    const c = audioContext();
    const resumePromise = c && c.state !== "running" ? c.resume().catch((error) => { logAudio("AudioContext resume rejected", error); }) : Promise.resolve();
    if (c) {
      try { const buffer = c.createBuffer(1, 1, c.sampleRate); const source = c.createBufferSource(); source.buffer = buffer; source.connect(c.destination); source.start(0); }
      catch (error) { logAudio("AudioContext prime failed", error); }
    }
    if (!audio) throw new Error("persistent_audio_element_unavailable");
    audio.pause(); audio.muted = true; audio.src = wavDataUri(0, 100); audio.load();
    startedPromise = new Promise<boolean>((resolve) => {
      let done = false;
      const finish = (ok: boolean) => { if (done) return; done = true; audio.removeEventListener("playing", onPlaying); audio.removeEventListener("ended", onEnded); audio.removeEventListener("error", onError); window.clearTimeout(timer); resolve(ok); };
      const onPlaying = () => finish(true); const onEnded = () => finish(true); const onError = () => finish(false);
      const timer = window.setTimeout(() => finish(false), 1800);
      audio.addEventListener("playing", onPlaying, { once: true }); audio.addEventListener("ended", onEnded, { once: true }); audio.addEventListener("error", onError, { once: true });
    });
    // Critical for iOS: invoke play in the same call stack as the tap, before any await.
    playPromise = audio.play();
    if ("speechSynthesis" in window) {
      try {
        const synth = window.speechSynthesis;
        if (synth.paused) synth.resume();
        // Prime Web Speech synchronously in the real user-gesture call stack.
        const utterance = new SpeechSynthesisUtterance(" ");
        utterance.volume = 0;
        utterance.rate = 4;
        utterance.onend = () => releaseUtterance(utterance);
        utterance.onerror = () => releaseUtterance(utterance);
        synth.cancel();
        activeUtterances.length = 0;
        retainUtterance(utterance);
        synth.speak(utterance);
        if (synth.paused) synth.resume();
      } catch (error) { logAudio("speechSynthesis unlock probe failed", error); }
    }
    await Promise.all([resumePromise, playPromise, startedPromise]);
    const started = await startedPromise;
    if (!started) throw new Error("audio_play_resolved_without_playing_event");
    audio.pause(); try { audio.currentTime = 0; } catch { /* Safari may reject seek before metadata */ }
    audio.muted = muted;
    unlocked = true; unlockError = "";
    logAudio("audio unlock succeeded", `context=${c?.state || "unavailable"}; audioSession=${audioSessionType()}`);
    emitAudioState();
    // Audible confirmation lets the learner know the tap actually unlocked playback.
    if (!chimed) {
      chimed = true;
      try { await playLocalBeep(880, 140); }
      catch (error) { logAudio("confirmation chime failed", error); }
    }
    return true;
  } catch (error) {
    unlockError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    unlocked = false;
    logAudio("audio unlock failed", unlockError);
    if (audio) audio.muted = muted;
    emitAudioState();
    return false;
  }
}

let unlockPromise: Promise<boolean> | null = null;
export function unlockAudio(): Promise<boolean> {
  // This check must run synchronously when called from a pointer/key gesture.
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); }
    catch (error) { logAudio("speechSynthesis resume during unlock failed", error); }
  }
  if (unlocked) return Promise.resolve(true);
  if (unlockPromise) return unlockPromise;
  unlockPromise = performUnlockAudio().then((result) => {
    if ("speechSynthesis" in window) {
      try { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); }
      catch (error) { logAudio("speechSynthesis resume after unlock failed", error); }
    }
    return result;
  }).finally(() => { unlockPromise = null; });
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
    if (/natural|neural|premium|enhanced|siri/i.test(voice.name)) candidate += 3;
    // Network voices (e.g. Chrome's "Google ..." and Edge "Online") can stall without firing
    // onstart/onend, which used to surface as speechSynthesis_watchdog_timeout. Prefer on-device voices.
    if (voice.localService) candidate += 4; else candidate -= 4;
    // macOS ships joke voices (e.g. "Bad News", "Zarvox") that are local and en-US; never pick them.
    if (/^(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|pipe organ)$/i.test(voice.name)) candidate -= 20;
    if (/espeak|compact/i.test(voice.name)) candidate -= 5;
    if (voice.default) candidate += 1;
    if (candidate > score) { best = voice; score = candidate; }
  }
  return best;
}

async function cloudTts(text: string, locale: string, rate: number): Promise<string | null> {
  // Once Gemini returns 429, stop retrying each sentence/request during the cooldown.
  // speak() will transparently use the browser's local speech engine instead.
  if (Date.now() < cloudTtsCooldownUntil) return null;
  try {
    console.info("[LingoArena audio] TTS attempt", { engine: "cloud", locale: resolveLocale(locale), textLength: text.length });
    const response = await fetch("/api/tts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, locale: resolveLocale(locale), rate }),
    });
    lastApiStatus = String(response.status);
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      if (response.status === 429) {
        const retryHeader = response.headers.get("retry-after");
        const retrySeconds = Math.max(30, Math.min(300, Number(retryHeader) || 60));
        cloudTtsCooldownUntil = Date.now() + retrySeconds * 1000;
        // This is a provider quota/rate-limit event, not a total audio failure: browser TTS is the fallback.
        logAudio("Gemini TTS rate limited; switching to browser speech synthesis", `cooldown=${retrySeconds}s`);
        setTtsDebug("browser_speech_fallback", "", String(response.status));
      } else {
        setTtsDebug("cloud_tts_failed", `HTTP ${response.status}: ${detail.slice(0, 180)}`, String(response.status));
        logAudio("cloud TTS response rejected", `HTTP ${response.status}`);
      }
      return null;
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("audio/")) {
      const detail = await response.clone().text().catch(() => "");
      setTtsDebug("cloud_tts_failed", `Expected audio/* but received ${contentType || "no Content-Type"}: ${detail.slice(0, 120)}`, String(response.status));
      return null;
    }
    const blob = await response.blob();
    if (!blob.size) { setTtsDebug("cloud_tts_failed", "empty_audio_blob", String(response.status)); return null; }
    return URL.createObjectURL(blob);
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

function playWithPersistentAudio(src: string, token: number, cb?: { onStart?: () => void; onEnd?: () => void }, alreadyPrepared = false): Promise<boolean> {
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
      if (src.startsWith("blob:")) URL.revokeObjectURL(src);
      if (cancelCurrentPlayback === cancel) cancelCurrentPlayback = null;
      if (played && token === speakingToken) cb?.onEnd?.();
      resolve(played);
    };
    const cancel = () => finishPlayback(false);
    cancelCurrentPlayback = cancel;
    const onPlaying = () => { started = true; startAmplitudeTracking(audio); if (token === speakingToken) cb?.onStart?.(); };
    const onEnded = () => finishPlayback(true);
    const onError = () => { const mediaError = audio.error; setTtsDebug("cloud_playback_failed", mediaError ? `MediaError code=${mediaError.code} message=${mediaError.message}` : "audio_element_error", lastApiStatus); finishPlayback(false); };
    audio.pause();
    audio.currentTime = 0;
    audio.src = src;
    audio.muted = muted;
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    // Mid-reply sentences skip the mic-release wait: the microphone is already off.
    void (alreadyPrepared ? Promise.resolve() : prepareForPlayback()).then(() => audio.play()).then(() => {
      setTtsDebug("cloud_tts", "", lastApiStatus);
      if (!started && token === speakingToken) cb?.onStart?.();
    }).catch((error) => {
      cleanup();
      setTtsDebug("cloud_playback_failed", error instanceof Error ? error.message : String(error), lastApiStatus);
      logAudio("persistent audio playback rejected; browser fallback will be tried", error);
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
  try {
    // Cancel only if something is actually queued. Chrome silently drops an utterance spoken
    // immediately after cancel(), so when we did cancel, give the engine a moment first.
    const hadQueue = synth.speaking || synth.pending;
    if (hadQueue) synth.cancel();
    activeUtterances.length = 0;
    // Do not wait for voiceschanged: on iOS that leaves the user-gesture call stack.
    // getVoices() is intentionally synchronous; Safari can use its default voice if empty.
    const voices = synth.getVoices();
    const voice = pickVoice(locale, voices);
    if (synth.paused) synth.resume();

    const chunks = text.match(/[^.!?。！？]+[.!?。！？]*/g)?.map((part) => part.trim()).filter(Boolean) ?? [text];
    let index = 0;
    let chunkWatchdog = 0;
    const speakSentence = (sentence: string, attempt: number) => {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = voice?.lang ?? resolveLocale(locale);
      if (voice) utterance.voice = voice;
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = muted ? 0 : 1;
      let started = false;
      const clear = () => { if (chunkWatchdog) window.clearTimeout(chunkWatchdog); chunkWatchdog = 0; };
      // Two-stage watchdog: the engine must start within 3 s, then finish within a rate-aware estimate.
      const armFinishWatchdog = () => {
        clear();
        chunkWatchdog = window.setTimeout(() => {
          if (token !== speakingToken) return;
          logAudio("speechSynthesis end event missing; continuing", sentence.slice(0, 60));
          releaseUtterance(utterance);
          next();
        }, Math.min(20000, 2500 + (sentence.length * 85) / Math.max(0.5, rate)));
      };
      utterance.onstart = () => { started = true; armFinishWatchdog(); if (token === speakingToken) cb?.onStart?.(); };
      // Lets the animated tutor move its mouth on each spoken word (browser voices expose no audio level).
      utterance.onboundary = (event) => { if (event.name === "word" && token === speakingToken) window.dispatchEvent(new Event("lingo-speech-boundary")); };
      utterance.onend = () => { clear(); releaseUtterance(utterance); next(); };
      utterance.onerror = (event) => {
        clear();
        releaseUtterance(utterance);
        if (token !== speakingToken || event.error === "canceled" || event.error === "interrupted") return;
        setTtsDebug("browser_speech_synthesis_failed", `speechSynthesis ${event.error}`, lastApiStatus);
        next();
      };
      chunkWatchdog = window.setTimeout(() => {
        if (token !== speakingToken || started) return;
        releaseUtterance(utterance);
        try { synth.cancel(); } catch (error) { logAudio("speechSynthesis cancel after stall failed", error); }
        if (attempt === 0) {
          // Engine stalled: retry once after a short pause before reporting anything.
          logAudio("speechSynthesis did not start; retrying", sentence.slice(0, 60));
          window.setTimeout(() => { if (token === speakingToken) speakSentence(sentence, 1); }, 150);
        } else {
          setTtsDebug("browser_speech_synthesis_timeout", `speechSynthesis_watchdog_timeout:${sentence.slice(0, 60)}`, lastApiStatus);
          next();
        }
      }, 3000);
      // Keep the utterance alive until onend/onerror; Safari can GC unreferenced utterances.
      retainUtterance(utterance);
      synth.speak(utterance);
      if (synth.paused) synth.resume();
    };
    const next = () => {
      if (chunkWatchdog) window.clearTimeout(chunkWatchdog);
      if (token !== speakingToken) return;
      if (index >= chunks.length) {
        activeSpeechResolve = null;
        window.setTimeout(() => { if (token === speakingToken) cb?.onEnd?.(); }, 150);
        return;
      }
      speakSentence(chunks[index++]!, 0);
    };
    activeSpeechResolve = () => { synth.cancel(); };
    // Speak now, not from a later timer/effect, so Safari can honor the primed engine;
    // only after a cancel do we wait briefly (Chrome drops utterances queued right after cancel()).
    if (hadQueue) window.setTimeout(next, 80); else next();
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    setTtsDebug("browser_speech_synthesis_failed", message, lastApiStatus);
    logAudio("browser speech fallback failed", error);
    cb?.onEnd?.();
  }
}

const NATURAL_VOICE_KEY = "lingoarena-natural-voice";
/** The tutor's natural AI voice (cloud TTS) is on unless the learner turned it off in Settings. */
export function naturalVoiceEnabled(): boolean {
  try { return localStorage.getItem(NATURAL_VOICE_KEY) !== "off"; } catch { return true; }
}
export function setNaturalVoice(enabled: boolean) {
  try { localStorage.setItem(NATURAL_VOICE_KEY, enabled ? "on" : "off"); } catch { /* storage blocked */ }
}
/**
 * Fetches natural cloud speech for one sentence without playing it (so the next sentence can be
 * fetched while the current one plays). Resolves null when disabled, muted or unavailable.
 */
export function prefetchSpeech(text: string, locale: string, rate: number): Promise<string | null> {
  if (!naturalVoiceEnabled() || muted || typeof window === "undefined") return Promise.resolve(null);
  return cloudTts(text, locale, rate);
}
/** Plays speech fetched with prefetchSpeech. `continuing` = a later sentence of the same reply. Resolves false if it could not play. */
export function playPreparedSpeech(url: string, cb: { onStart?: () => void; onEnd?: () => void }, continuing = false): Promise<boolean> {
  if (!continuing) void unlockAudio();
  const token = ++speakingToken;
  return playWithPersistentAudio(url, token, cb, continuing);
}

export type SpeakOptions = { lang: string; accent?: string; rate?: number };
type SpeakCallbacks = { onStart?: () => void; onEnd?: () => void };
/** Local-first TTS: browser speech is the default; cloud TTS is opt-in to protect prototype quota. */
export function speak(text: string, options: SpeakOptions, callbacks?: SpeakCallbacks): boolean;
export function speak(text: string, locale: string, rate?: number, callbacks?: SpeakCallbacks): boolean;
export function speak(text: string, localeOrOptions: string | SpeakOptions, rateOrCallbacks: number | SpeakCallbacks = 1, legacyCallbacks?: SpeakCallbacks): boolean {
  const options: SpeakOptions = typeof localeOrOptions === "string" ? { lang: localeOrOptions, rate: typeof rateOrCallbacks === "number" ? rateOrCallbacks : 1 } : localeOrOptions;
  const locale = options.lang;
  const rate = options.rate ?? 1;
  const cb = typeof rateOrCallbacks === "object" ? rateOrCallbacks : legacyCallbacks;
  if (typeof window === "undefined" || !text.trim()) { cb?.onEnd?.(); return false; }
  // Resume a paused iOS speech engine synchronously before any network/async work.
  if ("speechSynthesis" in window) {
    try { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); } catch (error) { logAudio("speechSynthesis resume failed", error); }
    // Read voices synchronously; never wait for voiceschanged before starting speech.
    try { window.speechSynthesis.getVoices(); } catch (error) { logAudio("speechSynthesis getVoices failed", error); }
  }
  void unlockAudio(); // invoked immediately; the first media play occurs before any await
  const token = ++speakingToken;
  const clean = text.trim();
  if (muted) { cb?.onEnd?.(); return true; }
  void (async () => {
    // Prototype default: never spend Gemini TTS quota for routine playback.
    // Cloud TTS can be explicitly enabled in this browser for voice-quality testing.
    let cloudEnabled = false;
    try { cloudEnabled = localStorage.getItem("lingoarena-cloud-tts") === "enabled"; } catch { /* local storage may be blocked */ }
    const onStartOnce = (() => { let started = false; return () => { if (!started) { started = true; cb?.onStart?.(); } }; })();
    if (!cloudEnabled || !("speechSynthesis" in window)) {
      browserSpeak(clean, locale, rate, token, { onStart: onStartOnce, onEnd: cb?.onEnd });
      return;
    }
    // Optional cloud path for deliberate voice-quality tests only. Never retry each
    // sentence after a 429; switch the rest of the utterance to browser speech.
    const chunks = clean.match(/[^.!?。！？]+[.!?。！？]*/g)?.map((part) => part.trim()).filter(Boolean) ?? [clean];
    for (let index = 0; index < chunks.length; index++) {
      const audio = await cloudTts(chunks[index]!, locale, rate);
      if (token !== speakingToken) return;
      if (!audio) { browserSpeak(chunks.slice(index).join(" "), locale, rate, token, { onStart: onStartOnce, onEnd: cb?.onEnd }); return; }
      const played = await playWithPersistentAudio(audio, token, { onStart: onStartOnce });
      if (token !== speakingToken) return;
      if (!played) { browserSpeak(chunks.slice(index).join(" "), locale, rate, token, { onStart: onStartOnce, onEnd: cb?.onEnd }); return; }
    }
    if (token === speakingToken) { await sleep(300); if (token === speakingToken) cb?.onEnd?.(); }
  })();
  return true;
}

export async function testSound(): Promise<void> {
  if (!unlocked) {
    const ok = await unlockAudio();
    if (!ok) throw new Error(getAudioDebugState().unlockError || "audio_unlock_failed");
  }
  try { await playLocalBeep(660, 180); setTtsDebug("local_beep_test", "", "local"); }
  catch (error) { const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error); setTtsDebug("local_beep_failed", message, "local"); throw error; }
}

export function testBrowserVoice(locale = "en-US"): Promise<void> {
  if (!("speechSynthesis" in window)) return Promise.reject(new Error("speechSynthesis_unavailable"));
  return (async () => {
    if (!unlocked) {
      const ok = await unlockAudio();
      if (!ok) throw new Error(getAudioDebugState().unlockError || "audio_unlock_failed");
    }
    await new Promise<void>((resolve, reject) => {
      const synth = window.speechSynthesis; synth.cancel();
      const utterance = new SpeechSynthesisUtterance("LingoArena sound test.");
      utterance.lang = resolveLocale(locale); utterance.volume = 1; utterance.rate = 0.9;
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return; settled = true; window.clearTimeout(watchdog);
        releaseUtterance(utterance);
        utterance.onstart = null; utterance.onend = null; utterance.onerror = null;
        if (error) { setTtsDebug("browser_voice_failed", error.message, "browser"); reject(error); }
        else { setTtsDebug("browser_voice_test", "", "browser"); resolve(); }
      };
      const watchdog = window.setTimeout(() => finish(new Error("speechSynthesis_watchdog_timeout_after_6000ms")), 6000);
      const voices = synth.getVoices(); const voice = pickVoice(locale, voices); if (voice) utterance.voice = voice;
      utterance.onstart = () => setTtsDebug("browser_voice_test", "", "browser");
      utterance.onend = () => finish();
      utterance.onerror = (event) => finish(new Error(`speechSynthesis ${event.error}`));
      try {
        retainUtterance(utterance);
        synth.speak(utterance);
        if (synth.paused) synth.resume();
      } catch (error) { finish(error instanceof Error ? error : new Error(String(error))); }
    });
  })();
}

export async function testCloudVoice(locale = "en-US"): Promise<void> {
  if (!unlocked) { const ok = await unlockAudio(); if (!ok) throw new Error(getAudioDebugState().unlockError || "audio_unlock_failed"); }
  const response = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "This is a LingoArena cloud voice test.", locale, rate: 1 }) });
  setAudioApiStatus(`tts-test:${response.status}`);
  const type = response.headers.get("content-type") || "";
  if (!response.ok || !type.toLowerCase().startsWith("audio/")) {
    const body = await response.text().catch(() => "");
    const error = new Error(`/api/tts HTTP ${response.status}; Content-Type=${type || "missing"}; ${body.slice(0, 220)}`);
    setTtsDebug("cloud_voice_test_failed", error.message, String(response.status)); throw error;
  }
  const audio = persistentPlayer(); if (!audio) throw new Error("persistent_audio_element_unavailable");
  const blob = await response.blob(); if (!blob.size) throw new Error("cloud_tts_returned_empty_audio");
  const url = URL.createObjectURL(blob); audio.pause(); audio.src = url; audio.muted = muted; audio.load();
  try {
    await audio.play(); setTtsDebug("cloud_voice_test", "", String(response.status));
    await new Promise<void>((resolve, reject) => {
      const done = () => { cleanup(); resolve(); }; const fail = () => { cleanup(); reject(new Error(audio.error ? `MediaError ${audio.error.code}: ${audio.error.message}` : "cloud_audio_element_error")); };
      const cleanup = () => { audio.removeEventListener("ended", done); audio.removeEventListener("error", fail); };
      audio.addEventListener("ended", done, { once: true }); audio.addEventListener("error", fail, { once: true });
      window.setTimeout(() => { cleanup(); if (audio.ended || audio.paused) resolve(); else reject(new Error("cloud_voice_test_timeout")); }, 12000);
    });
  } catch (error) { const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error); setTtsDebug("cloud_voice_test_failed", message, String(response.status)); throw error; }
  finally { URL.revokeObjectURL(url); }
}

export function installFirstGestureUnlock(): () => void {
  if (typeof window === "undefined") return () => undefined;
  let handled = false;
  const onGesture = () => { if (handled) return; handled = true; document.removeEventListener("pointerdown", onGesture, true); document.removeEventListener("touchend", onGesture, true); void unlockAudio(); };
  document.addEventListener("pointerdown", onGesture, { capture: true, once: true });
  document.addEventListener("touchend", onGesture, { capture: true, once: true });
  return () => { document.removeEventListener("pointerdown", onGesture, true); document.removeEventListener("touchend", onGesture, true); };
}

export function stopSpeaking() {
  speakingToken++;
  if (player) { player.pause(); try { player.currentTime = 0; } catch { /* ignored */ } }
  cancelCurrentPlayback?.(); cancelCurrentPlayback = null;
  stopAmplitudeTracking();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    activeUtterances.length = 0; // explicit cancellation ends our ownership of queued utterances
  }
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

/** Local-first transcription. Cloud STT is used only if local inference cannot run. */
export async function transcribeAudio(blob: Blob, locale: string): Promise<string> {
  if (!blob.size) throw new Error("STT_AUDIO_EMPTY");
  const localStartedAt = performance.now();
  try {
    logDiagnostic("stt", "local_transcription_started", "info", { audioBytes: blob.size, mimeType: blob.type || "unknown", locale: resolveLocale(locale) });
    const localText = await transcribeLocally(blob, resolveLocale(locale), (progress) => {
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("lingo-stt-status", { detail: progress }));
    });
    logDiagnostic("stt", "local_transcription_succeeded", "info", { elapsedMs: Math.round(performance.now() - localStartedAt), transcriptLength: localText.length });
    setAudioApiStatus("local-whisper:ok");
    return localText;
  } catch (localError) {
    const localReason = localError instanceof Error ? `${localError.name}: ${localError.message}` : String(localError);
    logDiagnostic("stt", "local_transcription_failed_cloud_fallback", "warn", { elapsedMs: Math.round(performance.now() - localStartedAt), error: localReason });
    return cloudTranscribe(blob, locale, localReason);
  }
}

/** Final transcript for raw 16 kHz PCM from liveCapture: on-device Whisper first, then cloud (WAV). */
export async function transcribeRecording(pcm: Float32Array, locale: string, allowCloud = true): Promise<string> {
  if (!pcm.length) throw new Error("STT_AUDIO_EMPTY");
  const localStartedAt = performance.now();
  try {
    logDiagnostic("stt", "local_transcription_started", "info", { samples: pcm.length, locale: resolveLocale(locale) });
    const localText = await transcribePcm(pcm, resolveLocale(locale));
    if (!localText.trim()) throw new Error("LOCAL_STT_EMPTY_TRANSCRIPT");
    logDiagnostic("stt", "local_transcription_succeeded", "info", { elapsedMs: Math.round(performance.now() - localStartedAt), transcriptLength: localText.length });
    setAudioApiStatus("local-whisper:ok");
    return localText.trim();
  } catch (localError) {
    const localReason = localError instanceof Error ? `${localError.name}: ${localError.message}` : String(localError);
    logDiagnostic("stt", allowCloud ? "local_transcription_failed_cloud_fallback" : "local_transcription_failed", "warn", { elapsedMs: Math.round(performance.now() - localStartedAt), error: localReason });
    if (!allowCloud) throw localError instanceof Error ? localError : new Error(localReason);
    return cloudTranscribe(encodeWav(pcm), locale, localReason);
  }
}

export async function cloudTranscribe(blob: Blob, locale: string, localReason: string): Promise<string> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new Error(`LOCAL_STT_FAILED_OFFLINE: ${localReason}. Connect once to download the local speech model, then retry.`);
  }
  // Optional recovery path. Normal transcription is performed on-device; this is not required
  // for local inference, but provides compatibility if the model cannot load on a device.
  const MAX_STT_AUDIO_BYTES = 1_400_000;
  if (blob.size > MAX_STT_AUDIO_BYTES) throw new Error("STT_AUDIO_TOO_LARGE: recording exceeded 1.4 MB; please record a shorter answer");
  const audioBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error || new Error("STT_FILE_READ_FAILED"));
    reader.readAsDataURL(blob);
  });
  const diagnosticId = createDiagnosticId("stt");
  const startedAt = performance.now();
  const mimeType = (blob.type || "audio/webm").split(";")[0]!;
  logDiagnostic("stt", "cloud_fallback_started", "warn", { diagnosticId, mimeType, audioBytes: blob.size, locale: resolveLocale(locale) });
  let response: Response;
  try {
    response = await fetch("/api/stt", {
      method: "POST", headers: { "Content-Type": "application/json", "x-lingo-request-id": diagnosticId },
      body: JSON.stringify({ audioBase64, mimeType, locale: resolveLocale(locale), diagnosticId }),
      signal: AbortSignal.timeout(35_000),
    });
  } catch (error) {
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    logDiagnostic("stt", "cloud_fallback_fetch_failed", "error", { diagnosticId, error: detail, elapsedMs: Math.round(performance.now() - startedAt) });
    throw new Error(`STT_LOCAL_AND_CLOUD_FAILED [diagnosticId=${diagnosticId}]: local=${localReason}; cloud=${detail}`);
  }
  setAudioApiStatus(`stt:${response.status}`);
  const responseText = await response.text().catch(() => "");
  const vercelId = response.headers.get("x-vercel-id") || "unavailable";
  let result: { text?: string; error?: string; details?: string; message?: string; provider?: string } = {};
  try { result = responseText ? JSON.parse(responseText) as typeof result : {}; } catch { result = { details: responseText.slice(0, 500) }; }
  if (!response.ok) {
    const reason = [result.error, result.details, result.message].filter(Boolean).join(": ").slice(0, 500);
    logDiagnostic("stt", "cloud_fallback_failed", "error", { diagnosticId, httpStatus: response.status, vercelId, elapsedMs: Math.round(performance.now() - startedAt), reason });
    throw new Error(`STT_LOCAL_AND_CLOUD_FAILED [diagnosticId=${diagnosticId}; vercelId=${vercelId}]: local=${localReason}; cloud=${reason || `HTTP ${response.status}`}`);
  }
  if (!result.text?.trim()) throw new Error("STT_CLOUD_FALLBACK_EMPTY");
  logDiagnostic("stt", "cloud_fallback_succeeded", "info", { diagnosticId, elapsedMs: Math.round(performance.now() - startedAt), transcriptLength: result.text.trim().length });
  return result.text.trim();
}


// iOS Safari may suspend audio after tab switches, screen lock, or an incoming call.
if (typeof window !== "undefined") {
  const recoverAudio = () => {
    unlocked = false;
    emitAudioState();
    const audioContext = ctx;
    if (audioContext && (audioContext.state === "suspended" || (audioContext.state as string) === "interrupted")) {
      void audioContext.resume().then(() => { logAudio("AudioContext resumed after visibility change"); emitAudioState(); }).catch((error) => { unlocked = false; unlockError = error instanceof Error ? error.message : String(error); emitAudioState(); });
    } else {
      // Re-prime the persistent player on return; if iOS requires a gesture, the banner remains visible.
      void unlockAudio();
    }
    if ("speechSynthesis" in window) {
      try { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); }
      catch (error) { logAudio("speechSynthesis resume after visibility change failed", error); }
    }
  };
  window.addEventListener("pageshow", recoverAudio);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") recoverAudio(); });
}
