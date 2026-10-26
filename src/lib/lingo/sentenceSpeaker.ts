import { playPreparedSpeech, prefetchSpeech, speak } from "@/lib/voice";

/**
 * Speaks streamed text sentence by sentence: the first sentence starts as soon as it is complete,
 * later ones queue behind it. `onDone` fires once the stream is finished and everything was spoken.
 */
export function createSentenceSpeaker(options: { lang: string; rate: number; natural?: boolean; onStart?: () => void; onDone?: () => void }) {
  let spokenUpTo = 0;
  // Each queued sentence starts fetching its natural (cloud) audio immediately, so it is ready
  // by the time the previous sentence finishes; null audio falls back to the browser voice.
  let queue: { text: string; audio: Promise<string | null> | null }[] = [];
  let spokenCount = 0;
  let speaking = false;
  let finished = false;
  let cancelled = false;
  let started = false;
  let doneFired = false;

  const maybeDone = () => {
    if (finished && !speaking && !queue.length && !doneFired && !cancelled) { doneFired = true; options.onDone?.(); }
  };
  const next = () => {
    if (cancelled || speaking) return;
    const item = queue.shift();
    if (!item) { maybeDone(); return; }
    speaking = true;
    const callbacks = {
      onStart: () => { if (!started) { started = true; options.onStart?.(); } },
      onEnd: () => { speaking = false; next(); },
    };
    const continuing = spokenCount++ > 0;
    const browserVoice = () => speak(item.text, { lang: options.lang, rate: options.rate }, callbacks);
    if (!item.audio) { browserVoice(); return; }
    void item.audio.then((url) => {
      if (cancelled) { if (url) URL.revokeObjectURL(url); return; }
      if (!url) { browserVoice(); return; }
      void playPreparedSpeech(url, callbacks, continuing).then((played) => { if (!played && !cancelled) browserVoice(); });
    });
  };
  // If natural audio is not ready within 6 s, use the device voice for that sentence rather than leave silence.
  const withTimeout = (audio: Promise<string | null>) => Promise.race([audio, new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000))]);
  const enqueue = (text: string) => queue.push({ text, audio: options.natural ? withTimeout(prefetchSpeech(text, options.lang, options.rate)) : null });
  return {
    /** Pass the full spoken text so far (without the correction line). */
    update(text: string, final = false) {
      const pending = text.slice(spokenUpTo);
      // A sentence is complete at . ! ? (or CJK equivalents) followed by whitespace, or at the end of a final update.
      const re = /[^.!?。！？]*[.!?。！？]+["'”’)]*(?=\s|$)/g;
      let match: RegExpExecArray | null;
      let consumed = 0;
      while ((match = re.exec(pending))) {
        const end = match.index + match[0].length;
        if (!final && end === pending.length) break; // might still be "Mr." or "3." mid-stream; wait for more
        const sentence = pending.slice(consumed, end).trim();
        if (sentence) enqueue(sentence);
        consumed = end;
      }
      if (final) {
        const rest = pending.slice(consumed).trim();
        if (rest) enqueue(rest);
        consumed = pending.length;
        finished = true;
      }
      spokenUpTo += consumed;
      next();
      maybeDone();
    },
    cancel() {
      cancelled = true;
      for (const item of queue) void item.audio?.then((url) => { if (url) URL.revokeObjectURL(url); });
      queue = [];
    },
  };
}
