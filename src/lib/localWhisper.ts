/**
 * Local-first speech-to-text powered by Transformers.js + Whisper in the browser.
 * Inference runs on-device in a Web Worker (see whisper.worker.ts). The model is downloaded
 * from Hugging Face on first use and cached by the browser; first download requires a network.
 */
export type LocalTranscriptionProgress = { status: string; progress?: number; file?: string };

type WorkerMessage =
  | { type: "progress"; model: string; progress: LocalTranscriptionProgress }
  | { type: "ready"; model: string }
  | { type: "load_error"; model: string; message: string }
  | { type: "result"; id: number; text: string }
  | { type: "error"; id: number; message: string };

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { model: string; resolve: (text: string) => void; reject: (error: Error) => void }>();
const readyModels = new Set<string>();
const loadingModels = new Set<string>();
let progressListener: ((progress: LocalTranscriptionProgress) => void) | null = null;

function notify(progress: LocalTranscriptionProgress) {
  progressListener?.(progress);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("lingo-local-stt-progress", { detail: progress }));
}

function getWorker(): Worker {
  if (worker) return worker;
  if (typeof Worker === "undefined") throw new Error("LOCAL_STT_WORKER_UNAVAILABLE");
  worker = new Worker(new URL("./whisper.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;
    if (message.type === "progress") notify(message.progress);
    else if (message.type === "ready") { loadingModels.delete(message.model); readyModels.add(message.model); }
    else if (message.type === "load_error") loadingModels.delete(message.model);
    else {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      if (message.type === "result") { readyModels.add(request.model); request.resolve(cleanTranscript(message.text)); }
      else request.reject(new Error(message.message));
    }
  };
  worker.onerror = (event) => {
    const error = new Error(`LOCAL_STT_WORKER_FAILED: ${event.message || "worker error"}`);
    for (const request of pending.values()) request.reject(error);
    pending.clear(); loadingModels.clear();
    worker?.terminate(); worker = null;
  };
  return worker;
}

// Phrases Whisper is known to invent for silence or noise; treat them as "nothing said".
const SILENCE_HALLUCINATIONS = /^(?:you|thank you|thanks|thank you for watching|thanks for watching|bye|okay|so|um|uh)[.!?]*$/i;
function cleanTranscript(text: string) {
  const cleaned = text.replace(/\[[^\]]*\]|\([^)]*\)|\*[^*]*\*/g, " ").replace(/\s+/g, " ").trim();
  return SILENCE_HALLUCINATIONS.test(cleaned) ? "" : cleaned;
}

let activeModel = "";
function chooseModel(locale: string) {
  // Use the smaller English-only model for English lessons; multilingual Whisper otherwise.
  return /^en(?:-|$)/i.test(locale) ? "onnx-community/whisper-tiny.en" : "onnx-community/whisper-tiny";
}

/** Starts downloading/compiling the model without transcribing; safe to call repeatedly. */
export function preloadLocalWhisper(locale: string) {
  const model = chooseModel(locale);
  if (readyModels.has(model) || loadingModels.has(model)) return;
  try {
    loadingModels.add(model);
    getWorker().postMessage({ type: "load", model });
  } catch {
    loadingModels.delete(model);
  }
}

export function isLocalWhisperReady(locale: string) { return readyModels.has(chooseModel(locale)); }

/** Transcribes 16 kHz mono PCM. Resolves with "" when nothing intelligible was said. */
export function transcribePcm(audio: Float32Array, locale: string): Promise<string> {
  const model = chooseModel(locale);
  activeModel = model;
  return new Promise<string>((resolve, reject) => {
    let target: Worker;
    try { target = getWorker(); } catch (error) { reject(error instanceof Error ? error : new Error(String(error))); return; }
    const id = nextId++;
    pending.set(id, { model, resolve, reject });
    // Copy so the caller's buffer stays usable, then transfer the copy to the worker.
    const copy = audio.slice();
    target.postMessage({ type: "transcribe", id, model, audio: copy }, [copy.buffer]);
  });
}

async function blobTo16kMono(blob: Blob): Promise<Float32Array> {
  const bytes = await blob.arrayBuffer();
  const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) throw new Error("LOCAL_STT_AUDIO_CONTEXT_UNAVAILABLE");
  const context = new AudioContextCtor();
  try {
    const decoded = await context.decodeAudioData(bytes.slice(0));
    const targetLength = Math.max(1, Math.ceil(decoded.duration * 16000));
    const mono = new Float32Array(targetLength);
    const channels = decoded.numberOfChannels;
    for (let channel = 0; channel < channels; channel++) {
      const input = decoded.getChannelData(channel);
      for (let i = 0; i < targetLength; i++) {
        const start = Math.floor((i * decoded.sampleRate) / 16000);
        const end = Math.min(input.length, Math.max(start + 1, Math.floor(((i + 1) * decoded.sampleRate) / 16000)));
        let sum = 0;
        for (let j = start; j < end; j++) sum += input[j];
        mono[i] += (sum / Math.max(1, end - start)) / channels;
      }
    }
    return mono;
  } finally {
    await context.close().catch(() => undefined);
  }
}

export async function transcribeLocally(blob: Blob, locale: string, onProgress?: (progress: LocalTranscriptionProgress) => void): Promise<string> {
  if (typeof window === "undefined") throw new Error("LOCAL_STT_BROWSER_ONLY");
  if (!blob.size) throw new Error("STT_AUDIO_EMPTY");
  progressListener = onProgress ?? null;
  try {
    notify({ status: "preparing_audio", progress: 0 });
    const audio = await blobTo16kMono(blob);
    if (!isLocalWhisperReady(locale)) notify({ status: "loading_model", progress: 0 });
    notify({ status: "transcribing", progress: 100 });
    const text = await transcribePcm(audio, locale);
    if (!text.trim()) throw new Error("LOCAL_STT_EMPTY_TRANSCRIPT");
    notify({ status: "complete", progress: 100 });
    return text.trim();
  } catch (error) {
    notify({ status: "error" });
    throw error;
  } finally {
    progressListener = null;
  }
}

export function getLocalWhisperStatus() {
  return { loaded: readyModels.size > 0, model: activeModel || null };
}
