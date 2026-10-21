import { useEffect, useRef, useState } from "react";
import { getAudioDebugState, installFirstGestureUnlock, testBrowserVoice, testCloudVoice, testSound } from "@/lib/voice";

type TestResult = { status: "pass" | "fail" | "running"; detail: string; latencyMs?: number };
type Health = { providers?: Record<string, string>; models?: Record<string, string>; runtime?: Record<string, string>; configured?: Record<string, boolean>; checkedAt?: string };

export function AudioDebugPanel({ compact = false, locale = "en-US", installGesture = true }: { compact?: boolean; locale?: string; installGesture?: boolean }) {
  const [state, setState] = useState(getAudioDebugState());
  const [health, setHealth] = useState<Health | null>(null);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [micLevel, setMicLevel] = useState(0);
  const [micRunning, setMicRunning] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const logsRef = useRef<string[]>([]);

  useEffect(() => {
    const removeGesture = installGesture ? installFirstGestureUnlock() : () => undefined;
    const refresh = () => setState(getAudioDebugState());
    const onLog = (event: Event) => {
      const line = String((event as CustomEvent<string>).detail || "");
      logsRef.current = [...logsRef.current, line].slice(-20);
      refresh();
    };
    window.addEventListener("lingo-audio-state", refresh);
    window.addEventListener("lingo-audio-log", onLog);
    const timer = window.setInterval(refresh, 900);
    void refreshHealth();
    return () => {
      removeGesture(); window.removeEventListener("lingo-audio-state", refresh); window.removeEventListener("lingo-audio-log", onLog); window.clearInterval(timer);
      stopMic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshHealth() {
    setResults((old) => ({ ...old, health: { status: "running", detail: "Checking /api/health…" } }));
    const started = performance.now();
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) throw new Error(`/api/health returned HTTP ${response.status}, Content-Type=${contentType || "missing"}; expected JSON`);
      const data = await response.json() as Health;
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
      setHealth(data); setResults((old) => ({ ...old, health: { status: "pass", detail: `${Math.round(performance.now() - started)} ms · ${JSON.stringify(data.providers || {})}` } }));
    } catch (error) {
      setHealth(null); setResults((old) => ({ ...old, health: { status: "fail", detail: error instanceof Error ? error.message : String(error) } }));
    }
  }

  async function runTest(id: string, task: () => Promise<unknown>) {
    setResults((old) => ({ ...old, [id]: { status: "running", detail: "Running…" } }));
    const started = performance.now();
    try {
      const value = await task();
      const detail = typeof value === "string" ? value : value === undefined ? "Completed successfully" : JSON.stringify(value);
      setResults((old) => ({ ...old, [id]: { status: "pass", detail, latencyMs: Math.round(performance.now() - started) } }));
    } catch (error) {
      const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      setResults((old) => ({ ...old, [id]: { status: "fail", detail, latencyMs: Math.round(performance.now() - started) } }));
    }
  }

  async function testChat() {
    const started = performance.now();
    const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: "Say hello in one short sentence." }], targetName: "English", nativeName: "English", persona: "guide", cefr: "A1", accent: "Auto", sessionTokensUsed: 0 }) });
    const type = response.headers.get("content-type") || "";
    const raw = await response.text();
    let data: Record<string, unknown> = {};
    if (type.includes("application/json")) { try { data = JSON.parse(raw) as Record<string, unknown>; } catch { /* include raw body below */ } }
    const latency = Math.round(performance.now() - started);
    if (!response.ok || !type.includes("application/json")) throw new Error(`HTTP ${response.status}; Content-Type=${type || "missing"}; latency=${latency}ms; body=${raw.slice(0, 500)}`);
    if (typeof data.text !== "string" || !data.text) throw new Error(`Chat response has no text. HTTP ${response.status}; body=${raw.slice(0, 500)}`);
    return `provider=${String(data.provider || "unknown")}; latency=${latency}ms; reply=${data.text}`;
  }

  async function startMic() {
    if (micRunning) { stopMic(); return; }
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("getUserMedia_unavailable_or_not_secure_context");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new Error("AudioContext_unavailable");
    const context = new Ctor(); ctxRef.current = context;
    const analyser = context.createAnalyser(); analyser.fftSize = 1024;
    context.createMediaStreamSource(stream).connect(analyser);
    const buffer = new Uint8Array(analyser.fftSize); setMicRunning(true);
    const tick = () => {
      analyser.getByteTimeDomainData(buffer);
      let sum = 0; for (const value of buffer) { const n = (value - 128) / 128; sum += n * n; }
      setMicLevel(Math.min(1, Math.sqrt(sum / buffer.length) * 8));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }

  function stopMic() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null;
    if (ctxRef.current) void ctxRef.current.close().catch(() => undefined); ctxRef.current = null;
    setMicRunning(false); setMicLevel(0);
  }

  async function copyReport() {
    const report = {
      capturedAt: new Date().toISOString(), audio: getAudioDebugState(), health,
      tests: results, userAgent: navigator.userAgent, url: location.href,
      last20Logs: logsRef.current.slice(-20),
    };
    try { await navigator.clipboard.writeText(JSON.stringify(report, null, 2)); setCopyMessage("Report copied"); }
    catch { setCopyMessage(JSON.stringify(report, null, 2)); }
  }

  const buttonClass = "min-h-12 rounded-xl border-2 border-border bg-card px-4 py-3 text-left text-sm font-extrabold active:scale-[.99]";
  const statusClass = (result?: TestResult) => result?.status === "pass" ? "text-emerald-700" : result?.status === "fail" ? "text-red-600" : result?.status === "running" ? "text-amber-700" : "text-muted-foreground";
  return <section className={compact ? "fixed bottom-3 left-3 z-[100] max-h-[78vh] w-[min(94vw,460px)] overflow-y-auto rounded-2xl border-2 border-border bg-card p-3 text-xs shadow-2xl" : "mx-auto min-h-screen max-w-3xl space-y-4 bg-background p-4 text-foreground sm:p-6"}>
    <div className="flex items-center justify-between gap-2"><h2 className="text-base font-extrabold">LingoArena diagnostics</h2><button className="rounded-lg border border-border px-3 py-2 font-bold" onClick={() => void refreshHealth()}>Refresh health</button></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <button className={buttonClass} onClick={() => void runTest("sound", () => testSound())}>Test sound</button>
      <button className={buttonClass} onClick={() => void runTest("browserVoice", () => testBrowserVoice(locale))}>Test browser voice</button>
      <button className={buttonClass} onClick={() => void runTest("cloudVoice", () => testCloudVoice(locale))}>Test cloud voice</button>
      <button className={buttonClass} onClick={() => void runTest("chat", testChat)}>Test chat</button>
      <button className={buttonClass} onClick={() => void runTest("microphone", startMic)}>{micRunning ? "Stop microphone test" : "Test microphone"}</button>
      <button className={buttonClass} onClick={() => void copyReport()}>Copy report</button>
    </div>
    {micRunning && <div className="space-y-1"><div className="text-xs font-bold">Live input level: {Math.round(micLevel * 100)}%</div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full bg-emerald-500 transition-[width]" style={{ width: `${micLevel * 100}%` }} /></div></div>}
    <div className="space-y-1 rounded-xl bg-muted/50 p-3">
      <div>Audio unlocked: <b>{String(state.unlocked)}</b> · AudioContext: <b>{state.contextState}</b></div>
      <div>Audio session: <b>{state.audioSessionType}</b> · Voices: <b>{state.voicesCount}</b></div>
      <div>Engine: <b>{state.currentEngine}</b> · Mic: <b>{state.micState}</b> · API: <b>{state.lastApiStatus}</b></div>
      <div>Silent switch: iOS may require silent mode off and volume up.</div>
      <div className="break-words">Unlock error: {state.unlockError || "none"}</div>
      <div className="break-words">Last TTS error: {state.lastTtsError || "none"}</div>
      <div className="break-words">User agent: {state.userAgent}</div>
    </div>
    <div className="rounded-xl border border-border p-3"><div className="mb-1 font-extrabold">Provider health</div>
      <div>OpenAI: <b>{health?.providers?.openai || "not checked"}</b> · key configured: {String(health?.configured?.openai ?? "unknown")}</div>
      <div>Gemini: <b>{health?.providers?.gemini || "not checked"}</b> · key configured: {String(health?.configured?.gemini ?? "unknown")}</div>
      {health?.models && <div className="mt-1 break-words">Models: {Object.entries(health.models).map(([key, value]) => `${key}=${value}`).join(" · ")}</div>}
      {health?.runtime && <div className="mt-1">Runtime: {JSON.stringify(health.runtime)}</div>}
    </div>
    <div className="space-y-2">{Object.entries(results).map(([key, result]) => <div key={key} className="rounded-lg border border-border p-2"><div className={`font-extrabold ${statusClass(result)}`}>{key}: {result.status.toUpperCase()}{result.latencyMs !== undefined ? ` · ${result.latencyMs}ms` : ""}</div><div className="break-words whitespace-pre-wrap">{result.detail}</div></div>)}</div>
    <div className="rounded-xl bg-muted/50 p-3"><div className="mb-1 font-extrabold">Last 20 audio logs</div><pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words text-[10px]">{(state.logs || []).join("\n") || "No audio logs yet"}</pre></div>
    {copyMessage && <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border p-2">{copyMessage}</pre>}
  </section>;
}
