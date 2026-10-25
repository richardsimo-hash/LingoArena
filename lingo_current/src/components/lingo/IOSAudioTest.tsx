import { useState } from "react";
import { getAudioDebugState, getRecognition, testBrowserVoice, testCloudVoice, testSound, unlockAudio } from "@/lib/voice";

type Result = { status: "PASS" | "FAIL" | "RUNNING"; detail: string };
const errorText = (error: unknown) => error instanceof Error ? `${error.name}: ${error.message}` : String(error);

export function IOSAudioTest() {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [copyText, setCopyText] = useState("");
  const [refresh, setRefresh] = useState(0);
  const state = getAudioDebugState();
  const run = async (id: string, task: () => Promise<string | void>) => {
    setResults((old) => ({ ...old, [id]: { status: "RUNNING", detail: "Running test…" } }));
    try { const detail = await task(); setResults((old) => ({ ...old, [id]: { status: "PASS", detail: detail || "Completed without an error." } })); }
    catch (error) { setResults((old) => ({ ...old, [id]: { status: "FAIL", detail: errorText(error) } })); }
    finally { setRefresh((n) => n + 1); }
  };
  const testWebAudio = async () => {
    const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) throw new Error("AudioContext_unavailable");
    const context = new Ctor(); await context.resume();
    const oscillator = context.createOscillator(); const gain = context.createGain();
    oscillator.frequency.value = 660; gain.gain.value = 0.12; oscillator.connect(gain).connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + 0.22);
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    const result = `AudioContext state=${context.state}`; await context.close();
    if (context.state !== "closed") throw new Error("AudioContext_failed_to_close");
    return result;
  };
  const testMicThenAudio = async () => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("getUserMedia_unavailable_or_insecure_context");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const before = stream.getTracks().map((track) => `${track.kind}:${track.readyState}`).join(", ");
    stream.getTracks().forEach((track) => track.stop());
    const stillLive = stream.getTracks().some((track) => track.readyState !== "ended");
    if (stillLive) throw new Error(`microphone_tracks_not_released: ${before}`);
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    await testSound(); return `Tracks released (${before}); persistent HTMLAudioElement played after mic release.`;
  };
  const testRecognitionThenAudio = async () => {
    const recognition = getRecognition();
    if (!recognition) throw new Error("SpeechRecognition_and_webkitSpeechRecognition_unavailable");
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timer = window.setTimeout(() => { if (!settled) { settled = true; try { recognition.abort(); } catch { /* abort attempted */ } reject(new Error("recognition_start_timeout_after_2500ms")); } }, 2500);
      recognition.onstart = () => { if (settled) return; settled = true; window.clearTimeout(timer); try { recognition.abort(); } catch (error) { reject(error); return; } resolve(); };
      recognition.onerror = (event: { error?: string }) => { if (settled) return; settled = true; window.clearTimeout(timer); reject(new Error(`recognition_error:${event.error || "unknown"}`)); };
      recognition.onend = () => { /* abort completion is checked below */ };
      try { recognition.lang = "en-US"; recognition.start(); } catch (error) { window.clearTimeout(timer); settled = true; reject(error); }
    });
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    await testSound();
    await testBrowserVoice("en-US");
    return "Recognition started and was aborted; HTMLAudioElement and speechSynthesis tests completed afterward.";
  };
  const copyReport = async () => {
    const report = { capturedAt: new Date().toISOString(), url: location.href, userAgent: navigator.userAgent,
      audioSessionType: (navigator as Navigator & { audioSession?: { type?: string } }).audioSession?.type ?? "unavailable",
      audioContextState: state.contextState, voicesCount: state.voicesCount, audio: state, tests: results };
    const value = JSON.stringify(report, null, 2); setCopyText(value);
    try { await navigator.clipboard.writeText(value); setCopyText("Report copied to clipboard.\n\n" + value); }
    catch { setCopyText("Clipboard unavailable; copy the report below manually.\n\n" + value); }
  };
  const button = "min-h-14 rounded-xl border-2 border-border bg-card px-4 py-4 text-left text-base font-extrabold shadow-sm";
  const resultColor = (status: Result["status"]) => status === "PASS" ? "text-emerald-700" : status === "FAIL" ? "text-red-600" : "text-amber-700";
  return <main className="mx-auto min-h-screen max-w-3xl space-y-4 bg-background p-4 pb-12 text-foreground sm:p-6">
    <h1 className="text-2xl font-black">LingoArena · iOS Audio Test</h1>
    <p className="text-sm text-muted-foreground">Run each test on the iPhone. Each result records the exact error. Tests A–F isolate playback, Web Audio, browser speech, cloud TTS, microphone release, and SpeechRecognition interactions.</p>
    <section className="space-y-1 break-words rounded-xl border-2 border-border bg-card p-3 text-sm">
      <div>Audio unlocked: <b>{String(state.unlocked)}</b> · AudioContext: <b>{state.contextState}</b></div>
      <div>Audio session: <b>{(navigator as Navigator & { audioSession?: { type?: string } }).audioSession?.type ?? "unavailable"}</b> · Voices: <b>{state.voicesCount}</b></div>
      <div>Engine: <b>{state.currentEngine}</b> · Last error: <b>{state.lastTtsError || state.unlockError || "none"}</b></div>
      <div>User agent: {navigator.userAgent}</div>
      <div>Refresh: {refresh}</div>
    </section>
    <div className="grid gap-3 sm:grid-cols-2">
      <button className={button} onClick={() => void run("A_html_audio", async () => { await testSound(); return "Persistent DOM HTMLAudioElement beep played."; })}>A. Test persistent HTML audio</button>
      <button className={button} onClick={() => void run("B_web_audio", testWebAudio)}>B. Test Web Audio</button>
      <button className={button} onClick={() => void run("C_browser_voice", async () => { await testBrowserVoice("en-US"); return "speechSynthesis finished or watchdog accepted it."; })}>C. Test browser voice</button>
      <button className={button} onClick={() => void run("D_cloud_tts", async () => { await testCloudVoice("en-US"); return "/api/tts returned playable audio."; })}>D. Test cloud TTS</button>
      <button className={button} onClick={() => void run("E_mic_release", testMicThenAudio)}>E. Mic → release → test audio</button>
      <button className={button} onClick={() => void run("F_recognition_abort", testRecognitionThenAudio)}>F. Recognition → abort → audio + voice</button>
      <button className={button} onClick={() => void run("unlock", async () => { const ok = await unlockAudio(); if (!ok) throw new Error(getAudioDebugState().unlockError || "audio_unlock_failed"); return "Audio unlocked."; })}>Enable / test unlock</button>
      <button className={button} onClick={() => void copyReport()}>Copy report</button>
    </div>
    <section className="space-y-2">{Object.entries(results).map(([id, result]) => <article key={id} className="rounded-xl border border-border bg-card p-3"><div className={`font-black ${resultColor(result.status)}`}>{id}: {result.status}</div><p className="break-words whitespace-pre-wrap text-sm">{result.detail}</p></article>)}</section>
    {copyText && <textarea aria-label="Audio test report" readOnly value={copyText} className="min-h-56 w-full rounded-xl border border-border bg-card p-3 text-xs" />}
  </main>;
}
