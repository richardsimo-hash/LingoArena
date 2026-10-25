import { speak } from "@/lib/voice";

/**
 * Speaks streamed text sentence by sentence: the first sentence starts as soon as it is complete,
 * later ones queue behind it. `onDone` fires once the stream is finished and everything was spoken.
 */
export function createSentenceSpeaker(options: { lang: string; rate: number; onStart?: () => void; onDone?: () => void }) {
  let spokenUpTo = 0;
  let queue: string[] = [];
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
    const sentence = queue.shift();
    if (!sentence) { maybeDone(); return; }
    speaking = true;
    speak(sentence, { lang: options.lang, rate: options.rate }, {
      onStart: () => { if (!started) { started = true; options.onStart?.(); } },
      onEnd: () => { speaking = false; next(); },
    });
  };
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
        if (sentence) queue.push(sentence);
        consumed = end;
      }
      if (final) {
        const rest = pending.slice(consumed).trim();
        if (rest) queue.push(rest);
        consumed = pending.length;
        finished = true;
      }
      spokenUpTo += consumed;
      next();
      maybeDone();
    },
    cancel() { cancelled = true; queue = []; },
  };
}
