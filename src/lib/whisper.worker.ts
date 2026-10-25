/**
 * Runs Whisper (Transformers.js) off the main thread so live transcription never freezes
 * the UI or drops microphone samples. Messages: load | transcribe -> progress | result | error.
 */
type Transcriber = (audio: Float32Array, options?: Record<string, unknown>) => Promise<{ text?: string } | string>;
type TransformersModule = {
  pipeline: (task: string, model: string, options?: Record<string, unknown>) => Promise<Transcriber>;
  env?: Record<string, any>;
};
type Request = { type: "load"; model: string } | { type: "transcribe"; id: number; model: string; audio: Float32Array };

const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2";
const ctx = self as unknown as { postMessage: (message: unknown) => void; onmessage: ((event: MessageEvent<Request>) => void) | null };

let modulePromise: Promise<TransformersModule> | null = null;
const pipelines = new Map<string, Promise<Transcriber>>();
let queue: Promise<unknown> = Promise.resolve();

function loadTransformers() {
  if (!modulePromise) {
    modulePromise = (import(/* @vite-ignore */ TRANSFORMERS_URL) as Promise<TransformersModule>).then((module) => {
      if (!module?.pipeline) throw new Error("LOCAL_STT_LIBRARY_UNAVAILABLE");
      if (module.env) {
        // Models must come from the Hugging Face Hub. Allowing local models makes the library
        // fetch /models/<id>/config.json from this site first, and the SPA rewrite answers that
        // with index.html, which fails as `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`.
        module.env.allowLocalModels = false;
        module.env.allowRemoteModels = true;
        module.env.useBrowserCache = true;
      }
      return module;
    }).catch((error) => {
      modulePromise = null;
      throw new Error(`LOCAL_STT_LIBRARY_LOAD_FAILED: ${error instanceof Error ? error.message : String(error)}`);
    });
  }
  return modulePromise;
}

function getPipeline(model: string) {
  let pipe = pipelines.get(model);
  if (!pipe) {
    pipe = loadTransformers().then((transformers) => transformers.pipeline("automatic-speech-recognition", model, {
      progress_callback: (progress: unknown) => ctx.postMessage({ type: "progress", model, progress }),
    }));
    pipe.catch(() => pipelines.delete(model));
    pipelines.set(model, pipe);
  }
  return pipe;
}

ctx.onmessage = (event) => {
  const message = event.data;
  if (message.type === "load") {
    getPipeline(message.model).then(
      () => ctx.postMessage({ type: "ready", model: message.model }),
      (error) => ctx.postMessage({ type: "load_error", model: message.model, message: error instanceof Error ? error.message : String(error) }),
    );
    return;
  }
  // Serialize inference: one transcription at a time keeps memory and CPU predictable.
  queue = queue.then(async () => {
    try {
      const transcriber = await getPipeline(message.model);
      const result = await transcriber(message.audio, { chunk_length_s: 30, stride_length_s: 5, return_timestamps: false });
      const text = typeof result === "string" ? result : typeof result?.text === "string" ? result.text : "";
      ctx.postMessage({ type: "result", id: message.id, text: text.trim() });
    } catch (error) {
      ctx.postMessage({ type: "error", id: message.id, message: error instanceof Error ? `${error.name}: ${error.message}` : String(error) });
    }
  });
};
