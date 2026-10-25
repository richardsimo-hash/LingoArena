import { useCallback, useEffect, useRef, useState } from "react";

export type ConversationState = "idle" | "listening" | "capturing" | "thinking" | "speaking";
type ListenOptions = { onNoSpeech?: () => void; silenceMs?: number; noVoiceTimeoutMs?: number };
type SpeechAdapter = { listen: (onDone: (text: string) => void, onInterim?: (text: string) => void, continuous?: boolean, opts?: ListenOptions) => void; stop: () => void };
type Options = {
  speech: SpeechAdapter; enabled: boolean; active: boolean;
  onTranscript: (text: string) => void; onInterim?: (text: string) => void;
  /** The learner stayed silent through several listening windows: prompt them so the call never stalls. */
  onIdle?: () => void;
};

/** Pause that ends a learner's turn. Short enough to feel like a call, long enough for a breath. */
const TURN_END_SILENCE_MS = 900;
/** How long to wait for the learner to start talking before counting a silent window. */
const NO_VOICE_WINDOW_MS = 9000;

/** Explicit half-duplex conversation state machine. The speech adapter owns microphone/VAD capture. */
export function useHandsFreeConversation({ speech, enabled, active, onTranscript, onInterim, onIdle }: Options) {
  const [state, setState] = useState<ConversationState>("idle");
  const stateRef = useRef(state);
  const speechRef = useRef(speech);
  const optionsRef = useRef({ enabled, active, onTranscript, onInterim, onIdle });
  const silentWindowsRef = useRef(0);
  speechRef.current = speech;
  optionsRef.current = { enabled, active, onTranscript, onInterim, onIdle };
  stateRef.current = state;

  const startListening = useCallback(() => {
    const current = optionsRef.current;
    if (!current.enabled || !current.active || stateRef.current === "speaking" || stateRef.current === "thinking") return;
    setState("listening"); stateRef.current = "listening";
    speechRef.current.listen((text) => {
      const clean = text.trim();
      if (!clean) { startListening(); return; }
      silentWindowsRef.current = 0;
      setState("thinking"); stateRef.current = "thinking";
      optionsRef.current.onTranscript(clean);
    }, (text) => {
      if (text.trim()) setState("capturing");
      optionsRef.current.onInterim?.(text);
    }, false, {
      silenceMs: TURN_END_SILENCE_MS,
      noVoiceTimeoutMs: NO_VOICE_WINDOW_MS,
      onNoSpeech: () => {
        const opts = optionsRef.current;
        if (!opts.enabled || !opts.active || stateRef.current !== "listening") return;
        silentWindowsRef.current++;
        if (silentWindowsRef.current >= 2 && opts.onIdle) {
          silentWindowsRef.current = 0;
          setState("thinking"); stateRef.current = "thinking";
          opts.onIdle();
        } else {
          setState("idle"); stateRef.current = "idle";
          window.setTimeout(() => startListening(), 50);
        }
      },
    });
  }, []);
  const stop = useCallback(() => { speechRef.current.stop(); setState("idle"); stateRef.current = "idle"; }, []);
  const thinking = useCallback(() => { speechRef.current.stop(); setState("thinking"); stateRef.current = "thinking"; }, []);
  const speaking = useCallback(() => { speechRef.current.stop(); setState("speaking"); stateRef.current = "speaking"; }, []);
  const resumeListening = useCallback(() => {
    if (!optionsRef.current.enabled || !optionsRef.current.active) { setState("idle"); stateRef.current = "idle"; return; }
    setState("idle"); stateRef.current = "idle";
    // Short gap so the tail of the tutor's voice is not picked up as the learner's answer.
    window.setTimeout(() => startListening(), 120);
  }, [startListening]);
  useEffect(() => { if (!enabled || !active) stop(); }, [enabled, active, stop]);
  return { state, startListening, stop, thinking, speaking, resumeListening, isListening: state === "listening" || state === "capturing" };
}
