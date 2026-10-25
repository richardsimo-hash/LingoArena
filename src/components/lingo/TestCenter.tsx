import { useEffect, useRef, useState } from "react";
import { cloudTranscribe, getRecognition, testBrowserVoice, testCloudVoice, testSound } from "@/lib/voice";
import { encodeWav, getPreferredMicId, setPreferredMicId, startLiveCapture, type LiveCapture } from "@/lib/liveCapture";
import { isLocalWhisperReady, preloadLocalWhisper, transcribePcm } from "@/lib/localWhisper";
import { flushUploads, logDiagnostic, sessionId } from "@/lib/diagnostics";

/**
 * /test — hardware and API self-check. Every result is uploaded to the Vercel logs under this
 * tab's session id, so a single id is enough to diagnose a device remotely. No audio or
 * transcript text is uploaded; transcripts are only shown on screen.
 */
type Status = "idle" | "running" | "pass" | "warn" | "fail";
type Result = { status: Status; detail: string; ms?: number };
const LOCALE = "en-US";
const errorText = (error: unknown) => error instanceof Error ? `${error.name}: ${error.message}` : String(error);

const TESTS: { id: string; group: string; label: string; hint: string }[] = [
  { id: "env", group: "Browser", label: "Browser capabilities", hint: "APIs the app relies on" },
  { id: "beep", group: "Speakers", label: "Beep", hint: "You should hear a short tone" },
  { id: "browserVoice", group: "Speakers", label: "Browser voice", hint: "Free on-device speech" },
  { id: "cloudVoice", group: "Speakers", label: "Cloud voice (/api/tts)", hint: "Uses Gemini tokens" },
  { id: "mic", group: "Microphone", label: "Record 4 s and play back", hint: "Speak normally; you should hear yourself" },
  { id: "micRaw", group: "Microphone", label: "Record 4 s without processing", hint: "Compares against echo cancellation / noise suppression" },
  { id: "webSpeech", group: "Recognition", label: "Browser speech recognition", hint: "Say a sentence within 6 s" },
  { id: "whisper", group: "Recognition", label: "On-device Whisper", hint: "Transcribes the last recording; free" },
  { id: "health", group: "Server", label: "/api/health", hint: "Gemini key and model check" },
  { id: "cloudStt", group: "Server", label: "Cloud transcription (/api/stt)", hint: "Sends the last recording; uses tokens" },
];

const STATUS_STYLE: Record<Status, string> = {
  idle: "bg-muted text-muted-foreground",
  running: "bg-accent text-accent-foreground animate-pulse",
  pass: "bg-success-soft text-success",
  warn: "bg-warn text-warn-foreground",
  fail: "bg-danger-soft text-destructive",
};

export function TestCenter() {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [micId, setMicId] = useState<string>(getPreferredMicId() || "");
  const [level, setLevel] = useState(0);
  const [modelProgress, setModelProgress] = useState("");
  const [copied, setCopied] = useState(false);
  const recordingRef = useRef<Float32Array | null>(null);
  const session = sessionId();

  const refreshDevices = async () => {
    try { setDevices((await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audioinput")); }
    catch { setDevices([]); }
  };
  useEffect(() => {
    void refreshDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);
    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ status?: string; progress?: number; file?: string }>).detail || {};
      if (detail.status === "progress" && typeof detail.progress === "number") setModelProgress(`Downloading model ${Math.round(detail.progress)}% ${detail.file ? `(${detail.file.split("/").pop()})` : ""}`);
      else if (detail.status === "ready") setModelProgress("Model ready");
    };
    window.addEventListener("lingo-local-stt-progress", onProgress);
    logDiagnostic("test", "test_page_opened", "info", { userAgent: navigator.userAgent.slice(0, 160) });
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", refreshDevices);
      window.removeEventListener("lingo-local-stt-progress", onProgress);
    };
  }, []);

  const run = async (id: string, task: () => Promise<{ status?: Status; detail: string; data?: Record<string, unknown> }>) => {
    setResults((old) => ({ ...old, [id]: { status: "running", detail: "Running…" } }));
    const started = performance.now();
    try {
      const outcome = await task();
      const ms = Math.round(performance.now() - started);
      const status = outcome.status ?? "pass";
      setResults((old) => ({ ...old, [id]: { status, detail: outcome.detail, ms } }));
      logDiagnostic("test", `test_${id}`, status === "fail" ? "error" : status === "warn" ? "warn" : "info", { result: status, ms, detail: outcome.detail.slice(0, 200), ...(outcome.data || {}) });
    } catch (error) {
      const ms = Math.round(performance.now() - started);
      setResults((old) => ({ ...old, [id]: { status: "fail", detail: errorText(error), ms } }));
      logDiagnostic("test", `test_${id}`, "error", { result: "fail", ms, error: errorText(error) });
    }
  };

  const record = async (raw: boolean) => {
    let capture: LiveCapture | null = null;
    capture = await startLiveCapture({ deviceId: micId || undefined, raw, onLevel: (rms) => setLevel(rms), noVoiceTimeoutMs: 60_000, maxDurationMs: 60_000 });
    await new Promise((resolve) => window.setTimeout(resolve, 4000));
    const stats = capture.stats();
    const pcm = capture.stop();
    setLevel(0);
    void refreshDevices(); // labels become available after permission is granted
    recordingRef.current = pcm;
    const url = URL.createObjectURL(encodeWav(pcm));
    const audio = new Audio(url);
    await audio.play().catch(() => undefined);
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    const peak = Number(stats.peakRms);
    const status: Status = peak < 0.002 ? "fail" : !stats.heardVoice ? "warn" : "pass";
    const verdict = peak < 0.002 ? "Digital silence: this input device sends no sound." : !stats.heardVoice ? "Very quiet: no speech detected." : "Voice detected.";
    return { status, detail: `${verdict} Device: ${stats.device}. Peak ${stats.peakRms}, avg ${stats.avgRms}. Playing back now.`, data: { ...stats, raw } };
  };

  const tests: Record<string, () => Promise<{ status?: Status; detail: string; data?: Record<string, unknown> }>> = {
    env: async () => {
      const caps = {
        secureContext: window.isSecureContext,
        webSpeech: Boolean(getRecognition()),
        getUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
        audioContext: Boolean(window.AudioContext || (window as Window & { webkitAudioContext?: unknown }).webkitAudioContext),
        speechSynthesis: "speechSynthesis" in window,
        worker: typeof Worker !== "undefined",
        webgpu: "gpu" in navigator,
        online: navigator.onLine,
        micPermission: await navigator.permissions?.query({ name: "microphone" as PermissionName }).then((p) => p.state).catch(() => "unknown") ?? "unknown",
      };
      const missing = Object.entries(caps).filter(([k, v]) => v === false && k !== "webgpu" && k !== "webSpeech").map(([k]) => k);
      return { status: missing.length ? "fail" : !caps.webSpeech ? "warn" : "pass", detail: Object.entries(caps).map(([k, v]) => `${k}=${v}`).join(" · "), data: caps };
    },
    beep: async () => { await testSound(); return { detail: "Tone played. Did you hear it?" }; },
    browserVoice: async () => { await testBrowserVoice(LOCALE); return { detail: "Spoken with the browser voice." }; },
    cloudVoice: async () => { await testCloudVoice(LOCALE); return { detail: "Cloud voice played." }; },
    mic: () => record(false),
    micRaw: () => record(true),
    webSpeech: () => new Promise((resolve, reject) => {
      const recognition = getRecognition();
      if (!recognition) { resolve({ status: "warn", detail: "Not available in this browser; on-device Whisper is used instead." }); return; }
      recognition.lang = LOCALE; recognition.interimResults = true; recognition.continuous = true;
      let text = ""; let errorCode = ""; let results = 0;
      recognition.onresult = (event: any) => { results++; text = Array.from(event.results as ArrayLike<any>).map((r) => r[0].transcript).join(" ").trim(); };
      recognition.onerror = (event: any) => { errorCode = event.error || "unknown"; };
      recognition.onend = () => {
        if (text) resolve({ detail: `Heard: “${text}”`, data: { results, chars: text.length } });
        else if (errorCode) reject(new Error(`SpeechRecognition error: ${errorCode}`));
        else resolve({ status: "fail", detail: "Ended with no text (the mic may be silent, or the browser's service is unavailable).", data: { results } });
      };
      try { recognition.start(); } catch (error) { reject(error); return; }
      window.setTimeout(() => { try { recognition.stop(); } catch { /* already stopped */ } }, 6000);
    }),
    whisper: async () => {
      const pcm = recordingRef.current;
      if (!pcm?.length) return { status: "warn", detail: "Run a microphone recording first." };
      if (!isLocalWhisperReady(LOCALE)) setModelProgress("Loading model…");
      const started = performance.now();
      const text = await transcribePcm(pcm, LOCALE);
      const ms = Math.round(performance.now() - started);
      return text ? { detail: `Heard: “${text}” (${ms} ms)`, data: { chars: text.length, inferenceMs: ms } } : { status: "warn", detail: `Model ran (${ms} ms) but heard no words.`, data: { inferenceMs: ms } };
    },
    health: async () => {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!(response.headers.get("content-type") || "").includes("json")) return { status: "fail", detail: `HTTP ${response.status} returned ${response.headers.get("content-type") || "no content type"}, not JSON: the API is not deployed on this host.` };
      const body = await response.json().catch(() => ({})) as { providers?: { gemini?: string }; models?: Record<string, string> };
      const gemini = body.providers?.gemini || "unknown";
      return { status: response.ok && gemini === "ok" ? "pass" : "fail", detail: `HTTP ${response.status} · gemini=${gemini} · ${Object.entries(body.models || {}).map(([k, v]) => `${k}=${v}`).join(" · ")}`, data: { httpStatus: response.status, gemini } };
    },
    cloudStt: async () => {
      const pcm = recordingRef.current;
      if (!pcm?.length) return { status: "warn", detail: "Run a microphone recording first." };
      const text = await cloudTranscribe(encodeWav(pcm), LOCALE, "test_page");
      return { detail: `Heard: “${text}”`, data: { chars: text.length } };
    },
  };

  const runAll = async () => {
    for (const test of TESTS) {
      if (test.id === "cloudVoice" || test.id === "cloudStt") continue; // skip token-spending tests in Run all
      await run(test.id, tests[test.id]!);
    }
    flushUploads();
  };

  const report = () => [
    `LingoArena test report · session ${session} · ${new Date().toISOString()}`,
    navigator.userAgent,
    ...TESTS.map((t) => `${t.label}: ${results[t.id]?.status ?? "not run"}${results[t.id]?.ms !== undefined ? ` (${results[t.id]!.ms} ms)` : ""} — ${results[t.id]?.detail ?? ""}`),
  ].join("\n");

  const groups = [...new Set(TESTS.map((t) => t.group))];
  return (
    <main className="mx-auto max-w-2xl space-y-5 p-4 pb-16">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold">LingoArena test center</h1>
        <p className="text-sm text-muted-foreground">Checks speakers, microphone, recognition and server APIs. Results are logged under session <b className="font-mono">{session}</b>. Send that id to get help.</p>
      </header>

      <section className="space-y-3 rounded-3xl border-2 border-border bg-card p-4">
        <label className="block text-xs font-extrabold uppercase text-muted-foreground" htmlFor="mic-select">Microphone</label>
        <div className="flex flex-wrap gap-2">
          <select id="mic-select" value={micId} onChange={(e) => setMicId(e.target.value)} className="min-w-0 flex-1 rounded-xl border-2 border-border bg-card p-2 font-bold">
            <option value="">System default</option>
            {devices.map((d, i) => <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Microphone ${i + 1} (grant access to see names)`}</option>)}
          </select>
          <button className="btn-3d bg-secondary px-4 py-2 text-sm text-secondary-foreground [--btn-shadow:color-mix(in_oklch,var(--secondary)_70%,black)]" onClick={() => { setPreferredMicId(micId || null); logDiagnostic("test", "preferred_mic_saved", "info", { custom: Boolean(micId) }); }}>
            Use in app
          </button>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted" aria-label="Input level">
          <div className="h-full bg-primary transition-[width] duration-75" style={{ width: `${Math.min(100, Math.round(Math.sqrt(level) * 220))}%` }} />
        </div>
        {modelProgress && <p className="text-xs text-muted-foreground">{modelProgress}</p>}
        <div className="flex flex-wrap gap-2">
          <button className="btn-3d bg-primary px-5 py-3 text-sm text-primary-foreground [--btn-shadow:var(--primary-shadow)]" onClick={() => void runAll()}>Run all (free tests)</button>
          <button className="btn-3d border-2 border-border bg-card px-5 py-3 text-sm [--btn-shadow:var(--border)]" onClick={() => preloadLocalWhisper(LOCALE)}>Preload Whisper model</button>
          <button className="btn-3d border-2 border-border bg-card px-5 py-3 text-sm [--btn-shadow:var(--border)]" onClick={() => { void navigator.clipboard?.writeText(report()).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500); }); flushUploads(); }}>{copied ? "Copied" : "Copy report"}</button>
        </div>
      </section>

      {groups.map((group) => (
        <section key={group} className="space-y-2">
          <h2 className="text-xs font-extrabold uppercase text-muted-foreground">{group}</h2>
          {TESTS.filter((t) => t.group === group).map((test) => {
            const result = results[test.id] ?? { status: "idle" as Status, detail: test.hint };
            return (
              <div key={test.id} className="flex items-start gap-3 rounded-2xl border-2 border-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold">{test.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${STATUS_STYLE[result.status]}`}>{result.status === "idle" ? "not run" : result.status}</span>
                    {result.ms !== undefined && <span className="text-[10px] text-muted-foreground">{result.ms} ms</span>}
                  </div>
                  <p className="mt-1 break-words text-xs text-muted-foreground">{result.detail}</p>
                </div>
                <button disabled={result.status === "running"} onClick={() => void run(test.id, tests[test.id]!).then(flushUploads)} className="btn-3d shrink-0 border-2 border-border bg-card px-3 py-2 text-xs [--btn-shadow:var(--border)] disabled:opacity-50">Run</button>
              </div>
            );
          })}
        </section>
      ))}
      <p className="text-center text-xs text-muted-foreground"><a className="underline" href="/">Back to LingoArena</a></p>
    </main>
  );
}
