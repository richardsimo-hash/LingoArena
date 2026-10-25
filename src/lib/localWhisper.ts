/**
 * Local-first speech-to-text powered by Transformers.js + Whisper in the browser.
 * The inference runs on-device. The model is downloaded from Hugging Face on first use
 * and can be cached by the browser; first download requires a network connection.
 */
export type LocalTranscriptionProgress = { status: string; progress?: number; file?: string };
type Pipeline = (task: string, model: string, options?: Record<string, unknown>) => Promise<(...args: any[]) => Promise<any>>;
type TransformersModule = { pipeline: Pipeline; env?: Record<string, any> };

let modulePromise: Promise<TransformersModule> | null = null;
let pipelinePromise: Promise<(...args: any[]) => Promise<any>> | null = null;
let activeModel = "";
let progressListener: ((progress: LocalTranscriptionProgress) => void) | null = null;

function notify(progress: LocalTranscriptionProgress) {
  progressListener?.(progress);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("lingo-local-stt-progress", { detail: progress }));
}

async function loadTransformers(): Promise<TransformersModule> {
  if (!modulePromise) {
    modulePromise = (async () => {
      // Load only when local transcription is actually needed, keeping initial app bundles small.
      // The package is version-pinned to avoid unexpected CDN changes.
      const importFromUrl = new Function("url", "return import(url)") as (url: string) => Promise<TransformersModule>;
      const module = await importFromUrl("https://esm.sh/@huggingface/transformers@3.7.2?bundle");
      if (!module?.pipeline) throw new Error("LOCAL_STT_LIBRARY_UNAVAILABLE");
      if (module.env) {
        module.env.allowRemoteModels = true;
        module.env.allowLocalModels = true;
      }
      return module;
    })().catch((error) => {
      modulePromise = null;
      const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      throw new Error(`LOCAL_STT_LIBRARY_LOAD_FAILED (${detail})`);
    });
  }
  return modulePromise;
}

function chooseModel(locale: string) {
  // Use the smaller English-only model for English lessons; multilingual Whisper otherwise.
  return /^en(?:-|$)/i.test(locale) ? "onnx-community/whisper-tiny.en" : "onnx-community/whisper-tiny";
}

async function getPipeline(locale: string) {
  const model = chooseModel(locale);
  if (pipelinePromise && activeModel === model) return pipelinePromise;
  activeModel = model;
  pipelinePromise = (async () => {
    notify({ status: "loading_model", progress: 0 });
    const transformers = await loadTransformers();
    return transformers.pipeline("automatic-speech-recognition", model, {
      progress_callback: (event: LocalTranscriptionProgress) => notify(event),
    });
  })().catch((error) => {
    pipelinePromise = null;
    activeModel = "";
    throw error;
  });
  return pipelinePromise;
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
    const transcriber = await getPipeline(locale);
    notify({ status: "transcribing", progress: 100 });
    const result = await transcriber(audio, {
      sampling_rate: 16000,
      chunk_length_s: 20,
      stride_length_s: 3,
      return_timestamps: false,
    });
    const text = typeof result === "string" ? result : typeof result?.text === "string" ? result.text : "";
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
  return { loaded: Boolean(pipelinePromise && activeModel), model: activeModel || null };
}
