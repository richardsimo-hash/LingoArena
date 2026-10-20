import { useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { Mic, MicOff, Volume2, VolumeX, Turtle, AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRecognition, speak, stopSpeaking, unlockAudio, isAudioUnlocked, isAudioMuted, setAudioMuted, transcribeAudio, resolveLocale, getAudioDebugState, setAudioMicState } from "@/lib/lingo/audio";
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
      <button aria-label={t("listenBtn")} onClick={() => speak(text, locale, rate)} className="btn-3d grid h-11 w-11 place-items-center bg-secondary text-secondary-foreground [--btn-shadow:color-mix(in_oklch,var(--secondary)_70%,black)]"><Volume2 className="h-5 w-5" /></button>
      <button aria-label={t("listenSlow")} onClick={() => speak(text, locale, 0.75)} className="btn-3d grid h-11 w-11 place-items-center border-2 border-border bg-card text-foreground [--btn-shadow:var(--border)]"><Turtle className="h-5 w-5" /></button>
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
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);
  const lastRef = useRef("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const silenceTimerRef = useRef<number | null>(null);
  const analyserFrameRef = useRef<number | null>(null);
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
      setListening(false);
      setAudioMicState("released_for_playback");
    };
    window.addEventListener("lingo-audio-will-play", releaseBeforePlayback);
    return () => {
      window.removeEventListener("lingo-audio-will-play", releaseBeforePlayback);
      try { recRef.current?.abort(); } catch { /* ignored */ }
      try { recorderRef.current?.stop(); } catch { /* ignored */ }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
      if (analyserFrameRef.current) cancelAnimationFrame(analyserFrameRef.current);
    };
  }, []);

  const listen = (onDone: (text: string) => void, onInterim?: (text: string) => void, continuous = true) => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isIOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const recognition = isIOS ? null : getRecognition();
    stopSpeaking();
    setError(null);
    lastRef.current = "";
    callbackRef.current = { onDone, onInterim };
    if (recognition) {
      recognition.lang = resolveLocale(locale); recognition.interimResults = true; recognition.continuous = continuous; recognition.maxAlternatives = 1;
      let delivered = false;
      const finish = () => {
        setListening(false); recognitionActiveRef.current = false; setAudioMicState("idle");
        if (suppressRecognitionEndRef.current) { suppressRecognitionEndRef.current = false; delivered = true; return; }
        if (delivered) return;
        delivered = true;
        if (lastRef.current) onDone(lastRef.current);
      };
      recognition.onresult = (event: any) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) text += `${event.results[i][0].transcript} `;
        lastRef.current = text.trim();
        onInterim?.(lastRef.current);
      };
      recognition.onerror = (event: any) => {
        if (event.error === "aborted") return;
        setError(event.error === "not-allowed" || event.error === "service-not-allowed" ? t("micBlocked") : event.error === "no-speech" ? t("noSpeech") : t("speechErr"));
        finish();
      };
      recognition.onend = finish;
      setListening(true); recognitionActiveRef.current = true; setAudioMicState("speech_recognition"); recRef.current = recognition;
      try { recognition.start(); } catch (cause) { setListening(false); setError(t("speechErr")); console.warn("[LingoArena STT] Web Speech start failed", cause); }
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
        recorder.onerror = () => setError(t("speechErr"));
        recorder.onstop = async () => {
          if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
          setListening(false);
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setAudioMicState("idle");
          if (suppressNextStopRef.current) { suppressNextStopRef.current = false; return; }
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          if (!blob.size) return;
          try {
            const transcript = await transcribeAudio(blob, locale);
            setError(null);
            lastRef.current = transcript;
            callbackRef.current?.onInterim?.(transcript);
            callbackRef.current?.onDone(transcript);
          } catch (cause) {
            console.warn("[LingoArena STT] server transcription unavailable", cause);
            setError("Speech transcription is unavailable. Check API configuration or type your answer.");
          }
        };
        recorder.start(250);
        setListening(true); setAudioMicState("recording");
        silenceTimerRef.current = window.setTimeout(() => {
          if (recorder.state === "recording") { setError(t("noSpeech")); recorder.stop(); }
        }, 15000);
        // Voice activity detection: stop after ~1.4s of low volume. The mic button also stops it.
        const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextCtor) {
          const audioContext = new AudioContextCtor();
          const analyser = audioContext.createAnalyser(); analyser.fftSize = 512;
          audioContext.createMediaStreamSource(stream).connect(analyser);
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
    try { recRef.current?.abort(); } catch { /* ignored */ }
    try { if (recorderRef.current?.state === "recording") recorderRef.current.stop(); } catch { /* ignored */ }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setListening(false); setAudioMicState("idle");
  };
  return { listening, error, supported, listen, stop };
}

/** Global sound status/banner. The unlock action is a real user gesture for mobile browsers. */
export function AudioControls() {
  const [unlocked, setUnlocked] = useState(isAudioUnlocked());
  const [muted, setMuted] = useState(isAudioMuted());
  const [debug, setDebug] = useState(() => new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("debug") === "1");
  const [debugState, setDebugState] = useState(getAudioDebugState());
  const [health, setHealth] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<{ unlocked: boolean; muted: boolean }>).detail;
      setUnlocked(detail.unlocked); setMuted(detail.muted); setDebugState(getAudioDebugState());
    };
    const updateDebug = () => setDebugState(getAudioDebugState());
    window.addEventListener("lingo-audio-state", update);
    const timer = window.setInterval(updateDebug, 1200);
    if (debug) void fetch("/api/health").then(async (r) => { const data = await r.json(); setHealth(data.providers || {}); }).catch(() => setHealth({ openai: "unreachable", gemini: "unreachable" }));
    return () => { window.removeEventListener("lingo-audio-state", update); window.clearInterval(timer); };
  }, [debug]);
  return <div className="flex items-center gap-2">
    {!unlocked && <button onClick={() => void unlockAudio()} className="rounded-xl border border-flame bg-warn px-2 py-1 text-xs font-bold text-warn-foreground" title="Check that your phone is not on silent and the volume is up">Tap to enable sound · check silent mode / volume</button>}
    <button aria-label={muted ? "Unmute audio" : "Mute audio"} title={muted ? "Unmute audio" : "Mute audio"} onClick={() => { const next = !muted; setAudioMuted(next); setMuted(next); if (!next) void unlockAudio(); }} className="rounded-xl border-2 border-border bg-card p-2">
      {muted ? <VolumeX className="h-4 w-4" /> : <AudioLines className="h-4 w-4" />}
    </button>
    {debug && <div className="fixed bottom-3 left-3 z-[100] max-w-[92vw] rounded-xl border border-border bg-card p-3 text-xs shadow-xl">
      <div className="mb-1 font-extrabold">LingoArena audio debug</div>
      <div>Audio unlocked: {String(debugState.unlocked)} · Context: {debugState.contextState}</div>
      <div>TTS: {debugState.currentEngine} · Voices: {debugState.voicesCount}</div>
      <div>Mic: {debugState.micState} · API: {debugState.lastApiStatus}</div>
      <div className="max-w-[80vw] break-words">Last TTS error: {debugState.lastTtsError || "none"}</div>
      <div>OpenAI: {health?.openai || "checking"} · Gemini: {health?.gemini || "checking"}</div>
      <button className="mt-1 underline" onClick={() => void fetch("/api/health").then(async (r) => { const data = await r.json(); setHealth(data.providers || {}); }).catch(() => setHealth({ openai: "unreachable", gemini: "unreachable" }))}>Refresh provider health</button>
    </div>}
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
