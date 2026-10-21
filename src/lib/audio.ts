/** Shared mobile-safe audio/TTS manager. All playback reuses one persistent HTMLAudioElement. */
let ctx: AudioContext | null = null;
let player: HTMLAudioElement | null = null;
let audioAnalyser: AnalyserNode | null = null;
let amplitudeFrame = 0;
let unlocked = false;
let currentEngine = "none";
let lastTtsError = "";
let lastApiStatus = "not_checked";
let micState = "idle";
let muted = false;
let speakingToken = 0;
let unlockError = "";
const debugLogs: string[] = [];
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
    // Do not use display:none: iOS Safari can refuse to start media on a fully hidden element.
    player.style.position = "fixed";
    player.style.width = "1px"; player.style.height = "1px";
    player.style.opacity = "0.01"; player.style.pointerEvents = "none";
    player.style.left = "-10px"; player.style.bottom = "0";
    player.setAttribute("aria-hidden", "true");
    document.body.appendChild(player);
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
  return { unlocked, muted, contextState: ctx?.state || "unavailable", currentEngine, lastTtsError, unlockError, voicesCount: typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis.getVoices().length : 0, micState, lastApiStatus, audioSessionType: audioSessionType(), userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unavailable", logs: [...debugLogs] };
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
      try { const utterance = new SpeechSynthesisUtterance("a"); utterance.volume = 0.01; utterance.rate = 4; window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance); }
      catch (error) { logAudio("speechSynthesis unlock probe failed", error); }
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
    void testSound().catch((error) => logAudio("confirmation chime failed", error));
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
      const detail = await response.text().catch(() => "");
      setTtsDebug("cloud_tts_failed", `HTTP ${response.status}: ${detail.slice(0, 180)}`, String(response.status));
      logAudio("cloud TTS response rejected", `HTTP ${response.status}`);
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
    const onError = () => { const mediaError = audio.error; setTtsDebug("cloud_playback_failed", mediaError ? `MediaError code=${mediaError.code} message=${mediaError.message}` : "audio_element_error", lastApiStatus); finishPlayback(false); };
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

export async function testSound(): Promise<void> {
  const audio = persistentPlayer(); if (!audio) throw new Error("persistent_audio_element_unavailable");
  audio.pause(); audio.muted = muted; audio.src = wavDataUri(660, 180); audio.load();
  const playing = new Promise<void>((resolve, reject) => {
    const onEnd = () => { cleanup(); resolve(); }; const onError = () => { cleanup(); reject(new Error(audio.error ? `MediaError ${audio.error.code}: ${audio.error.message}` : "audio_element_error")); };
    const cleanup = () => { audio.removeEventListener("ended", onEnd); audio.removeEventListener("error", onError); };
    audio.addEventListener("ended", onEnd, { once: true }); audio.addEventListener("error", onError, { once: true });
    window.setTimeout(() => { cleanup(); if (!audio.paused) { audio.pause(); resolve(); } else reject(new Error("beep_playback_timeout")); }, 1200);
  });
  try { await audio.play(); await playing; setTtsDebug("local_beep_test", "", "local"); }
  catch (error) { const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error); setTtsDebug("local_beep_failed", message, "local"); throw error; }
}

export function testBrowserVoice(locale = "en-US"): Promise<void> {
  if (!("speechSynthesis" in window)) return Promise.reject(new Error("speechSynthesis_unavailable"));
  return new Promise((resolve, reject) => {
    const synth = window.speechSynthesis; synth.cancel();
    const utterance = new SpeechSynthesisUtterance("LingoArena sound test.");
    utterance.lang = resolveLocale(locale); utterance.volume = 1; utterance.rate = 0.9;
    const voices = synth.getVoices(); const voice = pickVoice(locale, voices); if (voice) utterance.voice = voice;
    utterance.onstart = () => setTtsDebug("browser_voice_test", "", "browser");
    utterance.onend = () => resolve();
    utterance.onerror = (event) => { const error = new Error(`speechSynthesis ${event.error}`); setTtsDebug("browser_voice_failed", error.message, "browser"); reject(error); };
    try { synth.speak(utterance); } catch (error) { reject(error); }
  });
}

export async function testCloudVoice(locale = "en-US"): Promise<void> {
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
  const onGesture = () => { if (handled) return; handled = true; window.removeEventListener("pointerdown", onGesture, true); window.removeEventListener("touchend", onGesture, true); void unlockAudio(); };
  window.addEventListener("pointerdown", onGesture, { capture: true, once: true });
  window.addEventListener("touchend", onGesture, { capture: true, once: true });
  return () => { window.removeEventListener("pointerdown", onGesture, true); window.removeEventListener("touchend", onGesture, true); };
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
    const audioContext = ctx;
    if (
      audioContext &&
      (audioContext.state === "suspended" || (audioContext.state as string) === "interrupted")
    ) {
      void audioContext.resume().then(() => { logAudio("AudioContext resumed after visibility change"); emitAudioState(); }).catch((error) => { unlocked = false; unlockError = error instanceof Error ? error.message : String(error); emitAudioState(); });
    } else {
      // Re-prime the persistent player on return; if iOS requires a gesture, the banner remains visible.
      void unlockAudio();
    }
  };
  window.addEventListener("pageshow", recoverAudio);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") recoverAudio(); });
}
