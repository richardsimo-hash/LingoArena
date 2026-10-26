import { useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { Mic, MicOff, Volume2, VolumeX, Turtle, AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRecognition, speak, stopSpeaking, unlockAudio, isAudioUnlocked, isAudioMuted, setAudioMuted, transcribeRecording, resolveLocale, getAudioDebugState, setAudioMicState, installFirstGestureUnlock } from "@/lib/voice";
import { isLocalWhisperReady, preloadLocalWhisper, transcribePcm } from "@/lib/localWhisper";
import { startLiveCapture, type LiveCapture } from "@/lib/liveCapture";
import { AudioDebugPanel } from "@/components/lingo/DebugPanel";
import { logDiagnostic } from "@/lib/diagnostics";
import { makeT, type K } from "@/lib/lingo/i18n";
import { soundHints } from "@/lib/lingo/soundHints";
import type { SpeechCompare } from "@/lib/lingo/engine";
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
  const lastRef = useRef("");
  const recRef = useRef<any>(null);
  const callbackRef = useRef<{ onDone: (text: string) => void; onInterim?: (text: string) => void } | null>(null);
  const recognitionActiveRef = useRef(false);
  const sessionRef = useRef<{ finish: (reason: string) => void; cancel: () => void } | null>(null);

  useEffect(() => {
    setSupported(!!getRecognition() || (typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia));
    // Warm up the on-device model so the first answer is not delayed by the download.
    preloadLocalWhisper(resolveLocale(locale));
    const releaseBeforePlayback = () => {
      setAudioMicState("releasing_before_playback");
      sessionRef.current?.cancel();
      setListening(false);
      setAudioMicState("released_for_playback");
      window.dispatchEvent(new Event("lingo-audio-mic-released"));
    };
    window.addEventListener("lingo-audio-will-play", releaseBeforePlayback);
    return () => {
      window.removeEventListener("lingo-audio-will-play", releaseBeforePlayback);
      sessionRef.current?.cancel();
    };
  }, [locale]);

  /**
   * One microphone session. Live text comes from Web Speech when the browser provides it, and
   * otherwise from on-device Whisper re-transcribing the growing recording about once a second.
   * The final answer prefers Web Speech text, then a full on-device Whisper pass, and only then
   * the optional cloud fallback.
   */
  type ListenOptions = {
    /** Called instead of showing "didn't hear you" when the turn ends without speech (hands-free keeps going). */
    onNoSpeech?: () => void;
    /** Pause length that ends a turn; shorter feels more conversational. */
    silenceMs?: number;
    noVoiceTimeoutMs?: number;
  };
  const listen = (onDone: (text: string) => void, onInterim?: (text: string) => void, continuous = true, opts: ListenOptions = {}) => {
    const silenceMs = opts.silenceMs ?? 1300;
    sessionRef.current?.cancel();
    const recognition = getRecognition();
    if (!recognition && !navigator.mediaDevices?.getUserMedia) { setSupported(false); setError(t("noVoice")); return; }
    stopSpeaking();
    setError(null);
    setProcessing(false);
    lastRef.current = "";
    callbackRef.current = { onDone, onInterim };
    const lang = resolveLocale(locale);
    preloadLocalWhisper(lang);

    let ended = false;
    let cancelled = false;
    let webText = "";
    let whisperText = "";
    let webSpeechActive = false;
    let capture: LiveCapture | null = null;
    let liveTimer: number | null = null;
    let liveBusy = false;
    let whisperCovered = 0; // samples included in the latest live transcript
    let recognitionEnded: (() => void) | null = null;

    const showInterim = () => {
      const text = webText || whisperText;
      if (!text) return;
      lastRef.current = text;
      setError(null);
      callbackRef.current?.onInterim?.(text);
    };
    const deliver = (text: string) => {
      lastRef.current = text;
      setError(null);
      callbackRef.current?.onInterim?.(text);
      callbackRef.current?.onDone(text);
    };
    const runLiveWhisper = () => {
      // Web Speech already streams text when it works; only spend CPU when it does not.
      if (ended || liveBusy || !capture || webText || !capture.heardVoice() || !isLocalWhisperReady(lang)) return;
      liveBusy = true;
      const pcm = capture.samples();
      const coveredAt = pcm.length;
      const recent = pcm.length > 16000 * 28 ? pcm.subarray(pcm.length - 16000 * 28) : pcm;
      transcribePcm(recent, lang)
        .then((text) => { if (text && !webText) { whisperText = text; whisperCovered = coveredAt; if (!ended) showInterim(); } })
        .catch((cause) => logDiagnostic("stt", "live_whisper_failed", "warn", { error: cause instanceof Error ? cause.message : String(cause) }))
        .finally(() => { liveBusy = false; });
    };

    const finish = async (reason: string) => {
      if (ended) return;
      ended = true;
      if (liveTimer) window.clearInterval(liveTimer);
      if (recognition && webSpeechActive) {
        if (cancelled) { try { recognition.abort(); } catch { /* ignored */ } }
        else {
          // stop() (not abort()) lets Web Speech flush its final result before we read webText.
          await new Promise<void>((resolve) => {
            recognitionEnded = resolve;
            window.setTimeout(resolve, 1500);
            try { recognition.stop(); } catch { resolve(); }
          });
        }
      }
      const stats = capture?.stats() ?? {};
      const pcm = capture?.stop() ?? new Float32Array(0);
      const heardVoice = capture?.heardVoice() ?? false;
      setListening(false); recognitionActiveRef.current = false; setAudioMicState("idle");
      if (sessionRef.current === session) sessionRef.current = null;
      if (cancelled) return;
      logDiagnostic("mic", "listen_finished", "info", { reason, webTextLength: webText.length, whisperTextLength: whisperText.length, recordedMs: Math.round((pcm.length / 16000) * 1000), webSpeechUsed: Boolean(recognition), ...stats });
      if (webText.trim()) { deliver(webText.trim()); return; }
      if (reason === "mic_blocked") { setError(t("micBlocked")); return; }
      const noSpeech = () => { if (opts.onNoSpeech) { setError(null); opts.onNoSpeech(); } else setError(t("noSpeech")); };
      if (pcm.length < 16000 * 0.3) { noSpeech(); return; }
      // Fast path: the turn ended on a pause and the live transcript already includes everything
      // said before that pause, so answer immediately instead of re-transcribing the whole clip.
      if (reason === "silence" && whisperText && whisperCovered >= pcm.length - 16 * (silenceMs + 300)) {
        logDiagnostic("stt", "live_transcript_reused", "info", { coveredMs: Math.round(whisperCovered / 16), recordedMs: Math.round(pcm.length / 16) });
        deliver(whisperText);
        return;
      }
      // A peak this low is digital silence: the browser is reading a muted or wrong input device.
      const silentMic = typeof stats.peakRms === "number" && stats.peakRms < 0.002;
      setProcessing(true);
      try {
        // On-device Whisper is free, so always try it; the cloud is only worth calling if voice was detected.
        const text = await transcribeRecording(pcm, locale, heardVoice);
        if (!text.trim()) throw new Error("STT_EMPTY");
        deliver(text.trim());
      } catch (cause) {
        logDiagnostic("mic", "final_transcription_failed", heardVoice ? "error" : "warn", { error: cause instanceof Error ? cause.message : String(cause), heardVoice, silentMic });
        if (whisperText) deliver(whisperText);
        else if (silentMic) setError(`Your microphone is sending silence (${String(stats.device || "unknown device")}). Pick the right input in your system sound settings or the browser's mic menu, then try again.`);
        else if (!heardVoice) noSpeech();
        else setError(`I couldn't recognize that speech. Please try again or type your answer. (${cause instanceof Error ? cause.message : String(cause)})`);
      } finally {
        setProcessing(false);
      }
    };
    const session = { finish: (reason: string) => void finish(reason), cancel: () => { cancelled = true; void finish("cancelled"); } };
    sessionRef.current = session;
    setListening(true);

    if (recognition) {
      recognition.lang = lang; recognition.interimResults = true; recognition.continuous = continuous; recognition.maxAlternatives = 1;
      recognition.onresult = (event: any) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) text += `${event.results[i][0].transcript} `;
        webText = text.trim();
        showInterim();
      };
      recognition.onerror = (event: any) => {
        logDiagnostic("mic", "browser_recognition_error", "warn", { error: event.error || "unknown", message: event.message || "" });
        // Errors such as "network" (Brave, Arc, offline) are fine: on-device Whisper keeps going.
        if ((event.error === "not-allowed" || event.error === "service-not-allowed") && !capture) void finish("mic_blocked");
      };
      recognition.onend = () => {
        webSpeechActive = false; recognitionActiveRef.current = false;
        recognitionEnded?.();
        if (ended) return;
        if (webText.trim() || !capture) { void finish("web_speech_end"); return; }
        if (capture.switchedFromVirtual) return;
        // Web Speech gave up without text; keep recording and let Whisper + silence detection finish the turn.
        logDiagnostic("mic", "web_speech_ended_without_text", "warn", {});
        setAudioMicState("local_whisper");
      };
      recRef.current = recognition;
      try {
        recognition.start();
        webSpeechActive = true; recognitionActiveRef.current = true;
        setAudioMicState("speech_recognition");
      } catch (cause) {
        logDiagnostic("mic", "browser_recognition_start_failed", "warn", { error: cause instanceof Error ? cause.message : String(cause) });
      }
    }

    startLiveCapture({
      // Hands-free turns (continuous=false) end on a pause; continuous turns end when the user taps stop.
      onSilenceAfterVoice: () => { if (!continuous || !webSpeechActive) void finish("silence"); },
      silenceMs,
      noVoiceTimeoutMs: opts.noVoiceTimeoutMs,
      onNoVoice: () => void finish("no_voice"),
      onMaxDuration: () => void finish("max_duration"),
    }).then((started) => {
      if (ended) { started.stop(); return; }
      capture = started;
      if (started.switchedFromVirtual && recognition && webSpeechActive) {
        // Web Speech always uses the system default input, which here is a silent virtual device.
        webSpeechActive = false; recognitionActiveRef.current = false;
        try { recognition.abort(); } catch { /* ignored */ }
        logDiagnostic("mic", "web_speech_disabled_virtual_default", "warn", started.stats());
      }
      if (!webSpeechActive) setAudioMicState("local_whisper");
      liveTimer = window.setInterval(runLiveWhisper, 900);
      window.setTimeout(() => { if (!ended && capture) logDiagnostic("mic", "level_check_1500ms", "info", capture.stats()); }, 1500);
      logDiagnostic("mic", "live_capture_started", "info", { locale: lang, webSpeech: webSpeechActive });
    }).catch((cause) => {
      logDiagnostic("mic", "live_capture_failed", "warn", { error: cause instanceof Error ? cause.message : String(cause) });
      if (!webSpeechActive) void finish("mic_blocked");
    });
  };

  const stop = () => {
    // finish() stops Web Speech gracefully (final result kept) and transcribes the recording.
    sessionRef.current?.finish("user_stop");
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

/**
 * Word-by-word pronunciation feedback: green words were recognised, red ones were not. Tapping a
 * word plays it slowly; "Hear it slowly" plays the whole phrase at 0.6x.
 */
export function WordFeedback({ result, heard, text, locale, native, big = false }: { result: SpeechCompare; heard?: string; text: string; locale: string; native: NativeLang; big?: boolean }) {
  const t = makeT(native);
  const missed = result.words.filter((w) => !w.ok).map((w) => w.w.replace(/[¿?¡!.,;:«»“”"]/g, ""));
  return (
    <div className="space-y-2">
      <div className={cn("flex flex-wrap justify-center gap-1.5 font-extrabold", big ? "text-3xl" : "text-xl")}>
        {result.words.map((w, k) => (
          <button key={k} type="button" onClick={() => speak(w.w.replace(/[¿?¡!.,;:«»“”"]/g, ""), { lang: locale, rate: 0.6 })} title={t("hearSlowly")}
            className={cn("rounded-lg px-1.5 underline decoration-dotted underline-offset-4 transition hover:scale-105", w.ok ? "bg-success-soft text-success" : "bg-danger-soft text-destructive")}>
            {w.w}
          </button>
        ))}
      </div>
      {heard && <p className="text-center text-sm text-muted-foreground">{t("weHeard")}: “{heard}”</p>}
      {heard && soundHints(text, heard, locale.slice(0, 2)).map((h, i) => (
        <p key={i} className="rounded-xl bg-accent p-2 text-sm"><span aria-hidden>👄 </span>{t(`hint_${h.kind}` as K, { exp: h.expected, got: h.heard, x: h.detail ?? "?" })}</p>
      ))}
      {missed.length > 0 && <p className="text-center text-sm font-bold">{t("practiceWords", { words: missed.join(", ") })}</p>}
      <div className="flex items-center justify-center gap-3">
        <button type="button" onClick={() => speak(text, { lang: locale, rate: 0.6 })} className="rounded-xl border-2 border-border px-3 py-1.5 text-xs font-extrabold hover:bg-muted">🐢 {t("hearSlowly")}</button>
        <span className="text-xs text-muted-foreground">{t("tapWordHint")}</span>
      </div>
    </div>
  );
}
