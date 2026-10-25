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

/**
 * Older builds let Transformers.js fetch /models/... from this site; the SPA rewrite answered with
 * index.html and the library cached that HTML as if it were config.json. Remove any cached entry
 * that is HTML (or empty) so the real files are downloaded from the Hub.
 */
async function purgeBadCacheEntries(clearAll = false): Promise<number> {
  if (typeof caches === "undefined") return 0;
  let removed = 0;
  try {
    if (clearAll) return (await caches.delete("transformers-cache")) ? 1 : 0;
    const cache = await caches.open("transformers-cache");
    for (const request of await cache.keys()) {
      const response = await cache.match(request);
      const type = response?.headers.get("content-type") || "";
      const bad = !response || type.includes("text/html")
        || (/\.json(?:$|\?)/.test(request.url) && (await response.clone().text()).trimStart().startsWith("<"));
      if (bad) { await cache.delete(request); removed++; }
    }
  } catch { /* the cache is an optimisation; never block transcription on it */ }
  return removed;
}
let purged: Promise<number> | null = null;

function getPipeline(model: string) {
  let pipe = pipelines.get(model);
  if (!pipe) {
    const create = (transformers: TransformersModule) => transformers.pipeline("automatic-speech-recognition", model, {
      progress_callback: (progress: unknown) => ctx.postMessage({ type: "progress", model, progress }),
    });
    purged ??= purgeBadCacheEntries().then((removed) => {
      if (removed) ctx.postMessage({ type: "progress", model, progress: { status: "cache_repaired", removed } });
      return removed;
    });
    pipe = purged.then(loadTransformers).then((transformers) => create(transformers).catch(async (error) => {
      // A corrupt cached file still fails as a JSON/protobuf parse error: clear the cache and retry once.
      if (!/JSON|Unexpected token|protobuf|invalid/i.test(String(error))) throw error;
      ctx.postMessage({ type: "progress", model, progress: { status: "cache_cleared_retry", error: String(error).slice(0, 120) } });
      await purgeBadCacheEntries(true);
      return create(transformers);
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
