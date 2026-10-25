import { useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { Mic, MicOff, Volume2, VolumeX, Turtle, AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getRecognition, speak, stopSpeaking, unlockAudio, isAudioUnlocked, isAudioMuted, setAudioMuted, transcribeAudio, resolveLocale, getAudioDebugState, setAudioMicState, installFirstGestureUnlock } from "@/lib/voice";
import { AudioDebugPanel } from "@/components/lingo/DebugPanel";
import { logDiagnostic } from "@/lib/diagnostics";
import { makeT } from "@/lib/lingo/i18n";
import type { NativeLang } from "@/lib/lingo/content";

type V = "primary" | "secondary" | "ghost" | "danger" | "warn";
const VARIANTS: Record<V, string> = {
  primary: "bg-primary text-primary-foreground [--btn-shadow:var(--primary-shadow)]",
  secondary: "bg-secondary text-secondary-foreground [--btn-shadow:color-mix(in_oklch,var(--secondary)_70%,black)]",
  ghost: "bg-card text-foreground border-2 border-border [--btn-shadow:var(--border)]",
  danger: "bg-destructive text-destructive-foreground [--btn-shadow:color-mix(in_oklch,var(--destructive)_70%,black)]",
  warn: "bg-flame text-primary-foreground [--btn-shadow:color-mix(in_oklch,var(--flame)_70%,black)]",
};
export function Btn({ variant = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: V }) {
  return <button {...p} className={cn("btn-3d px-5 py-3 text-sm", VARIANTS[variant], className)} />;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-3xl border-2 border-border bg-card p-5 text-card-foreground", className)}>{children}</div>;
}

export function SpeakButtons({ text, locale, rate, native = "en" }: { text: string; locale: string; rate: number; native?: NativeLang }) {
  const t = makeT(native);
  return (
    <div className="flex gap-2">
      <button aria-label={t("listenBtn")} onClick={() => speak(text, { lang: locale, rate })} className="btn-3d grid h-11 w-11 place-items-center bg-secondary text-secondary-foreground [--btn-shadow:color-mix(in_oklch,var(--secondary)_70%,black)]"><Volume2 className="h-5 w-5" /></button>
      <button aria-label={t("listenSlow")} onClick={() => speak(text, { lang: locale, rate: 0.75 })} className="btn-3d grid h-11 w-11 place-items-center border-2 border-border bg-card text-foreground [--btn-shadow:var(--border)]"><Turtle className="h-5 w-5" /></button>
    </div>
  );
}

/**
 * Speech capture prefers Web Speech. On browsers without it, MediaRecorder uploads audio
 * to the protected /api/stt route. In hands-free mode a short silence ends each turn.
 */
export function useSpeech(locale: string, native: NativeLang = "en") {
  const t = makeT(native);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);
  const lastRef = useRef("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<number | null>(null);
  const analyserFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const analyserSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const captureContextRef = useRef<AudioContext | null>(null);
  const callbackRef = useRef<{ onDone: (text: string) => void; onInterim?: (text: string) => void } | null>(null);
  const suppressNextStopRef = useRef(false);
  const suppressRecognitionEndRef = useRef(false);
  const recognitionActiveRef = useRef(false);

  useEffect(() => {
    setSupported(!!getRecognition() || (typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined"));
    const releaseBeforePlayback = () => {
      setAudioMicState("releasing_before_playback");
      const recorderWasActive = recorderRef.current?.state === "recording";
      suppressNextStopRef.current = recorderWasActive;
      suppressRecognitionEndRef.current = recognitionActiveRef.current;
      try { recRef.current?.abort(); } catch { /* ignored */ }
      try { if (recorderWasActive) recorderRef.current?.stop(); } catch { /* ignored */ }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (analyserFrameRef.current) cancelAnimationFrame(analyserFrameRef.current);
      analyserFrameRef.current = null;
      try { analyserSourceRef.current?.disconnect(); } catch { /* source may already be disconnected */ }
      try { analyserRef.current?.disconnect(); } catch { /* analyser may already be disconnected */ }
      analyserSourceRef.current = null; analyserRef.current = null;
      if (captureContextRef.current && captureContextRef.current.state !== "closed") void captureContextRef.current.close().catch((error) => console.warn("[LingoArena STT] capture context close failed", error));
      captureContextRef.current = null;
      setListening(false);
      setAudioMicState("released_for_playback");
      window.dispatchEvent(new Event("lingo-audio-mic-released"));
    };
    window.addEventListener("lingo-audio-will-play", releaseBeforePlayback);
    return () => {
      window.removeEventListener("lingo-audio-will-play", releaseBeforePlayback);
      try { recRef.current?.abort(); } catch { /* ignored */ }
      try { recorderRef.current?.stop(); } catch { /* ignored */ }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
      if (analyserFrameRef.current) cancelAnimationFrame(analyserFrameRef.current);
      try { analyserSourceRef.current?.disconnect(); } catch { /* source may already be disconnected */ }
      try { analyserRef.current?.disconnect(); } catch { /* analyser may already be disconnected */ }
      if (captureContextRef.current && captureContextRef.current.state !== "closed") void captureContextRef.current.close().catch(() => undefined);
    };
  }, []);

  const listen = (onDone: (text: string) => void, onInterim?: (text: string) => void, continuous = true) => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isIOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    // Local-first prototype policy: use the browser's recognition API when available,
    // avoiding a Gemini STT request for every practice attempt. Browser recognition may
    // itself use a browser/vendor service; this does not guarantee fully offline STT.
    // Recorded audio + /api/stt remains a fallback for browsers without recognition.
    const recognition = getRecognition();
    stopSpeaking();
    setError(null);
    setProcessing(false);
    lastRef.current = "";
    callbackRef.current = { onDone, onInterim };
    if (recognition) {
      recognition.lang = resolveLocale(locale); recognition.interimResults = true; recognition.continuous = continuous; recognition.maxAlternatives = 1;
      let delivered = false;
      // Keep a short-lived audio backup while using browser recognition. Some Chrome builds
      // stop recognition without returning a transcript even though the user spoke. Only if
      // that happens do we upload the captured audio to /api/stt, avoiding cloud STT on normal turns.
      type BackupCapture = { recorder: MediaRecorder; stream: MediaStream; chunks: BlobPart[]; stopped: Promise<Blob> };
      let backupPromise: Promise<BackupCapture | null> = Promise.resolve(null);
      let backupCapture: BackupCapture | null = null;
      let backupFinalized = false;
      if (navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined") {
        backupPromise = navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).then((stream) => {
          const preferredType = /iPad|iPhone|iPod/i.test(navigator.userAgent) ? "audio/mp4" : "audio/webm;codecs=opus";
          const mimeType = typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(preferredType) ? preferredType : undefined;
          const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
          const chunks: BlobPart[] = [];
          let resolveStopped!: (blob: Blob) => void;
          const stopped = new Promise<Blob>((resolve) => { resolveStopped = resolve; });
          recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
          recorder.onstop = () => resolveStopped(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
          recorder.onerror = () => resolveStopped(new Blob([], { type: recorder.mimeType || "audio/webm" }));
          recorder.start(250);
          backupCapture = { recorder, stream, chunks, stopped };
          logDiagnostic("mic", "backup_capture_started", "info", { mimeType: recorder.mimeType || "audio/webm" });
          return backupCapture;
        }).catch((cause) => {
          console.warn("[LingoArena STT] backup capture unavailable", cause);
          return null;
        });
      }
      const finishBackup = async (shouldTranscribe: boolean) => {
        if (backupFinalized) return;
        backupFinalized = true;
        const capture = backupCapture || await backupPromise;
        if (!capture) return;
        let blob: Blob;
        try {
          if (capture.recorder.state === "recording") capture.recorder.stop();
          blob = await Promise.race([capture.stopped, new Promise<Blob>((resolve) => window.setTimeout(() => resolve(new Blob(capture.chunks, { type: capture.recorder.mimeType || "audio/webm" })), 1200))]);
        } catch {
          blob = new Blob(capture.chunks, { type: capture.recorder.mimeType || "audio/webm" });
        } finally {
          capture.stream.getTracks().forEach((track) => track.stop());
        }
        if (!shouldTranscribe) return;
        logDiagnostic("mic", "backup_capture_stopped", blob.size ? "info" : "warn", { audioBytes: blob.size, mimeType: blob.type || "unknown", shouldTranscribe });
        if (!blob.size) {
          setError("No audio backup was captured. Please check microphone access and try again.");
          return;
        }
        try {
          setProcessing(true);
          setError("Transcribing your recording… this can take a few seconds.");
          setAudioMicState("cloud_stt_fallback");
          logDiagnostic("mic", "backup_transcription_started", "info", { audioBytes: blob.size, mimeType: blob.type || "unknown", locale: resolveLocale(locale) });
          const transcript = await transcribeAudio(blob, locale);
          if (!transcript.trim()) throw new Error("STT_EMPTY");
          lastRef.current = transcript.trim();
          setError(null);
          callbackRef.current?.onInterim?.(lastRef.current);
          callbackRef.current?.onDone(lastRef.current);
        } catch (cause) {
          logDiagnostic("mic", "backup_transcription_failed", "error", { error: cause instanceof Error ? cause.message : String(cause) });
          console.warn("[LingoArena STT] backup cloud transcription failed", cause);
          setError(`I couldn't recognize that speech. Please try again or type your answer. (${cause instanceof Error ? cause.message : String(cause)})`);
        } finally {
          setProcessing(false);
          setAudioMicState("idle");
        }
      };
      const finish = () => {
        setListening(false); recognitionActiveRef.current = false; setAudioMicState("idle");
        if (suppressRecognitionEndRef.current) { suppressRecognitionEndRef.current = false; delivered = true; void finishBackup(false); return; }
        if (delivered) return;
        delivered = true;
        if (lastRef.current.trim()) {
          onDone(lastRef.current.trim());
          void finishBackup(false);
        } else {
          // Do not immediately show "I didn't hear you": try transcribing the captured backup first.
          setProcessing(true);
          setError("I heard no browser transcript yet. Recovering your recording…");
          void finishBackup(true).then(() => {
            if (!lastRef.current.trim() && !backupCapture) setError(t("noSpeech"));
          }).finally(() => setProcessing(false));
        }
      };
      recognition.onresult = (event: any) => {
        logDiagnostic("mic", "browser_recognition_result", "info", { resultCount: event.results?.length || 0, isFinal: Boolean(event.results?.[event.results.length - 1]?.isFinal) });
        let text = "";
        for (let i = 0; i < event.results.length; i++) text += `${event.results[i][0].transcript} `;
        lastRef.current = text.trim();
        if (lastRef.current) setError(null);
        onInterim?.(lastRef.current);
      };
      recognition.onerror = (event: any) => {
        logDiagnostic("mic", "browser_recognition_error", "warn", { error: event.error || "unknown", message: event.message || "" });
        if (event.error === "aborted") return;
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setError(t("micBlocked"));
          void finishBackup(false);
          setListening(false); recognitionActiveRef.current = false; setAudioMicState("idle");
          return;
        }
        finish();
      };
      recognition.onend = finish;
      setListening(true); recognitionActiveRef.current = true; setAudioMicState("speech_recognition"); recRef.current = recognition;
      try { recognition.start(); logDiagnostic("mic", "browser_recognition_started", "info", { locale: resolveLocale(locale), backupRecorderAvailable: Boolean(backupCapture || backupPromise) }); } catch (cause) { setListening(false); setError(t("speechErr")); void finishBackup(false); logDiagnostic("mic", "browser_recognition_start_failed", "error", { error: cause instanceof Error ? cause.message : String(cause) }); console.warn("[LingoArena STT] Web Speech start failed", cause); }
      return;
    }

    // iOS Safari and browsers without SpeechRecognition: record and use the server STT fallback.
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setSupported(false); setError(t("noVoice")); return;
    }
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        streamRef.current = stream;
        const preferredType = /iPad|iPhone|iPod/i.test(navigator.userAgent) ? "audio/mp4" : "audio/webm;codecs=opus";
        const mimeType = typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(preferredType) ? preferredType : undefined;
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorderRef.current = recorder; chunksRef.current = [];
        recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
        recorder.onerror = (event) => { logDiagnostic("mic", "media_recorder_error", "error", { error: (event as Event).type }); setError(t("speechErr")); };
        recorder.onstop = async () => {
          logDiagnostic("mic", "media_recorder_stopped", "info", { chunks: chunksRef.current.length, audioBytes: chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0), mimeType: recorder.mimeType || "unknown" });
          if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
          setListening(false);
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          if (analyserFrameRef.current) cancelAnimationFrame(analyserFrameRef.current);
          analyserFrameRef.current = null;
          try { analyserSourceRef.current?.disconnect(); } catch { /* already disconnected */ }
          try { analyserRef.current?.disconnect(); } catch { /* already disconnected */ }
          analyserSourceRef.current = null; analyserRef.current = null;
          if (captureContextRef.current && captureContextRef.current.state !== "closed") void captureContextRef.current.close().catch((error) => console.warn("[LingoArena STT] capture context close failed", error));
          captureContextRef.current = null;
          setAudioMicState("idle");
          if (suppressNextStopRef.current) { suppressNextStopRef.current = false; return; }
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          if (!blob.size) { setError("No audio was captured. Check microphone permission and try again."); return; }
          try {
            setProcessing(true);
            setError("Recording captured. Transcribing…");
            const transcript = await transcribeAudio(blob, locale);
            setError(null);
            lastRef.current = transcript;
            callbackRef.current?.onInterim?.(transcript);
            callbackRef.current?.onDone(transcript);
          } catch (cause) {
            logDiagnostic("mic", "server_transcription_failed", "error", { error: cause instanceof Error ? cause.message : String(cause) });
            console.warn("[LingoArena STT] server transcription unavailable", cause);
            // Keep browser recognition as a fallback on desktop as well as iOS.
            const fallback = getRecognition();
            if (fallback) {
              toast.warning("Cloud transcription failed. Using browser speech recognition; playback may be affected until the mic stops.");
              try {
                fallback.lang = resolveLocale(locale); fallback.interimResults = true; fallback.continuous = continuous; fallback.maxAlternatives = 1;
                let delivered = false;
                fallback.onresult = (event: any) => {
                  let text = ""; for (let i = 0; i < event.results.length; i++) text += `${event.results[i][0].transcript} `;
                  lastRef.current = text.trim(); callbackRef.current?.onInterim?.(lastRef.current);
                };
                const finishFallback = () => {
                  setListening(false); recognitionActiveRef.current = false; setAudioMicState("idle");
                  if (!delivered && lastRef.current) { delivered = true; callbackRef.current?.onDone(lastRef.current); }
                };
                fallback.onerror = (event: any) => { if (event.error !== "aborted") setError(`Browser recognition fallback failed: ${event.error}`); finishFallback(); };
                fallback.onend = finishFallback;
                recRef.current = fallback; recognitionActiveRef.current = true; setAudioMicState("speech_recognition_fallback"); setListening(true);
                fallback.start();
              } catch (fallbackError) {
                setError(`STT unavailable: ${cause instanceof Error ? cause.message : String(cause)}; browser fallback failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
              }
            } else setError(`Speech transcription unavailable: ${cause instanceof Error ? cause.message : String(cause)}. Check API configuration or type your answer.`);
          } finally {
            setProcessing(false);
          }
        };
        recorder.start(250);
        logDiagnostic("mic", "media_recorder_started", "info", { mimeType: recorder.mimeType || "browser_default", locale: resolveLocale(locale), audioTracks: stream.getAudioTracks().length });
        setListening(true); setAudioMicState("recording");
        silenceTimerRef.current = window.setTimeout(() => {
          if (recorder.state === "recording") { setError(t("noSpeech")); recorder.stop(); }
        }, 15000);
        // Voice activity detection: stop after ~1.4s of low volume. The mic button also stops it.
        const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextCtor) {
          const audioContext = new AudioContextCtor(); captureContextRef.current = audioContext;
          const analyser = audioContext.createAnalyser(); analyser.fftSize = 512; analyserRef.current = analyser;
          const source = audioContext.createMediaStreamSource(stream); analyserSourceRef.current = source; source.connect(analyser);
          const data = new Uint8Array(analyser.fftSize);
          let heardVoice = false;
          let silentSince = 0;
          const recordingStartedAt = performance.now();
          const calibration: number[] = [];
          let noiseFloor = 0.012;
          const check = () => {
            if (recorder.state !== "recording") { void audioContext.close(); return; }
            if (!heardVoice && performance.now() - recordingStartedAt > 12000) {
              setError(t("noSpeech")); recorder.stop(); void audioContext.close(); return;
            }
            analyser.getByteTimeDomainData(data);
            let sum = 0; for (const value of data) { const normalized = (value - 128) / 128; sum += normalized * normalized; }
            const rms = Math.sqrt(sum / data.length);
            const elapsed = performance.now() - recordingStartedAt;
            if (elapsed < 500) { calibration.push(rms); noiseFloor = Math.max(0.006, calibration.reduce((a, b) => a + b, 0) / Math.max(1, calibration.length)); }
            const threshold = Math.max(0.025, noiseFloor * 2.6 + 0.012);
            if (rms > threshold) { heardVoice = true; silentSince = 0; }
            else if (heardVoice) { if (!silentSince) silentSince = performance.now(); if (performance.now() - silentSince > 1250 && performance.now() - recordingStartedAt > 400) { recorder.stop(); void audioContext.close(); return; } }
            if (elapsed > 30000) { recorder.stop(); void audioContext.close(); return; }
            analyserFrameRef.current = requestAnimationFrame(check);
          };
          analyserFrameRef.current = requestAnimationFrame(check);
        }
      } catch (cause) {
        console.warn("[LingoArena STT] microphone capture failed", cause);
        setListening(false); setError(t("micBlocked"));
      }
    })();
  };

  const stop = () => {
    // IMPORTANT: stop() finalizes recognition and emits its final result; abort() discards it.
    // All mic-driven experiences use this shared hook, so aborting here silently lost answers
    // in Grammar Battle, Speech Arena, Free Talk, and Learn Path.
    if (recognitionActiveRef.current && recRef.current) {
      try {
        recRef.current.stop();
        return; // onend calls finish(), which delivers the final transcript exactly once.
      } catch (cause) {
        console.warn("[LingoArena STT] graceful recognition stop failed", cause);
      }
    }

    // MediaRecorder's final dataavailable event must be allowed to run before tracks are released.
    if (recorderRef.current?.state === "recording") {
      try {
        recorderRef.current.stop();
        return; // recorder.onstop uploads the completed blob and invokes onDone.
      } catch (cause) {
        console.warn("[LingoArena STT] recorder stop failed", cause);
      }
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setListening(false);
    recognitionActiveRef.current = false;
    setAudioMicState("idle");
  };
  return { listening, processing, error, supported, listen, stop };
}

/** Global sound status/banner plus optional mobile diagnostics. */
export function AudioControls() {
  const [unlocked, setUnlocked] = useState(isAudioUnlocked());
  const [muted, setMuted] = useState(isAudioMuted());
  const [debug, setDebug] = useState(() => new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("debug") === "1");
  const [debugState, setDebugState] = useState(getAudioDebugState());
  const [unlocking, setUnlocking] = useState(false);
  useEffect(() => {
    const removeGesture = installFirstGestureUnlock();
    const update = () => { const current = getAudioDebugState(); setUnlocked(current.unlocked); setMuted(current.muted); setDebugState(current); };
    window.addEventListener("lingo-audio-state", update);
    const timer = window.setInterval(update, 900);
    return () => { removeGesture(); window.removeEventListener("lingo-audio-state", update); window.clearInterval(timer); };
  }, []);
  const enableSound = () => {
    setUnlocking(true);
    // Call immediately from this button gesture; unlockAudio starts media.play synchronously.
    void unlockAudio().finally(() => { setUnlocking(false); setDebugState(getAudioDebugState()); });
  };
  return <div className="flex items-center gap-2">
    {!unlocked && <div style={{ position: "fixed", right: "max(12px, env(safe-area-inset-right))", bottom: "max(88px, calc(env(safe-area-inset-bottom) + 76px))", zIndex: 2147483000, pointerEvents: "auto" }} className="flex max-w-[min(90vw,18rem)] flex-col items-start gap-1">
      <button type="button" onClick={enableSound} onTouchEnd={(event) => { event.preventDefault(); enableSound(); }} style={{ minHeight: 48, pointerEvents: "auto", touchAction: "manipulation" }} className="rounded-xl border-2 border-flame bg-warn px-4 py-3 text-sm font-extrabold text-warn-foreground shadow-2xl" title="Check that silent mode is off and volume is up">{unlocking ? "Enabling sound…" : "🔊 Enable sound"}</button>
      <span role="status" className="max-w-[min(90vw,18rem)] rounded-lg bg-card/95 px-2 py-1 text-[10px] font-semibold text-foreground shadow">{debugState.unlockError ? `Audio blocked: ${debugState.unlockError}` : "Tap to enable sound. Check volume and silent mode."}</span>
    </div>}
    <button aria-label={muted ? "Unmute audio" : "Mute audio"} title={muted ? "Unmute audio" : "Mute audio"} onClick={() => { const next = !muted; setAudioMuted(next); setMuted(next); if (!next) enableSound(); }} className="min-h-11 min-w-11 rounded-xl border-2 border-border bg-card p-2">
      {muted ? <VolumeX className="h-4 w-4" /> : <AudioLines className="h-4 w-4" />}
    </button>
    {debugState.lastTtsError && <span role="status" className="hidden max-w-28 break-words text-[10px] font-bold text-destructive sm:inline">Audio error: {debugState.lastTtsError}</span>}
    {debug && <AudioDebugPanel compact installGesture={false} />}
  </div>;
}

export function MicButton({ listening, onClick, big, disabled }: { listening: boolean; onClick: () => void; big?: boolean; disabled?: boolean }) {
  return (
    <button aria-label={listening ? "Stop" : "Mic"} onClick={onClick} disabled={disabled}
      className={cn("btn-3d grid place-items-center rounded-full", big ? "h-24 w-24" : "h-12 w-12",
        listening ? "bg-heart text-primary-foreground animate-pulse-ring [--btn-shadow:color-mix(in_oklch,var(--heart)_70%,black)]" : VARIANTS.secondary)}>
      {disabled ? <MicOff className={big ? "h-10 w-10" : "h-5 w-5"} /> : <Mic className={big ? "h-10 w-10" : "h-5 w-5"} />}
    </button>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-bold uppercase text-muted-foreground"><span>{label}</span><span>{value}%</span></div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all duration-700", value >= 80 ? "bg-primary" : value >= 50 ? "bg-flame" : "bg-destructive")} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
