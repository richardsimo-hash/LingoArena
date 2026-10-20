import { useCallback, useEffect, useRef, useState } from "react";

export type ConversationState = "idle" | "listening" | "capturing" | "thinking" | "speaking";
type SpeechAdapter = { listen: (onDone: (text: string) => void, onInterim?: (text: string) => void, continuous?: boolean) => void; stop: () => void };
type Options = { speech: SpeechAdapter; enabled: boolean; active: boolean; onTranscript: (text: string) => void; onInterim?: (text: string) => void };

/** Explicit half-duplex conversation state machine. The speech adapter owns microphone/VAD capture. */
export function useHandsFreeConversation({ speech, enabled, active, onTranscript, onInterim }: Options) {
  const [state, setState] = useState<ConversationState>("idle");
  const stateRef = useRef(state);
  const speechRef = useRef(speech);
  const optionsRef = useRef({ enabled, active, onTranscript, onInterim });
  speechRef.current = speech;
  optionsRef.current = { enabled, active, onTranscript, onInterim };
  stateRef.current = state;

  const startListening = useCallback(() => {
    const current = optionsRef.current;
    if (!current.enabled || !current.active || stateRef.current === "speaking" || stateRef.current === "thinking") return;
    setState("listening");
    speechRef.current.listen((text) => {
      const clean = text.trim();
      if (!clean) { setState("idle"); return; }
      setState("thinking");
      optionsRef.current.onTranscript(clean);
    }, (text) => {
      if (text.trim()) setState("capturing");
      optionsRef.current.onInterim?.(text);
    }, false);
  }, []);
  const stop = useCallback(() => { speechRef.current.stop(); setState("idle"); }, []);
  const thinking = useCallback(() => { speechRef.current.stop(); setState("thinking"); }, []);
  const speaking = useCallback(() => { speechRef.current.stop(); setState("speaking"); }, []);
  const resumeListening = useCallback(() => {
    if (!optionsRef.current.enabled || !optionsRef.current.active) { setState("idle"); return; }
    setState("idle");
    window.setTimeout(() => startListening(), 350);
  }, [startListening]);
  useEffect(() => { if (!enabled || !active) stop(); }, [enabled, active, stop]);
  return { state, startListening, stop, thinking, speaking, resumeListening, isListening: state === "listening" || state === "capturing" };
}
