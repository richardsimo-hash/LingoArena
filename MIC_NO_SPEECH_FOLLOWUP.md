# Microphone no-speech recovery follow-up

## Symptom
Chrome starts the microphone but returns no recognized text, leading the UI to show “I didn't hear you - try again.”

## Change
The shared `useSpeech` hook now captures a temporary MediaRecorder backup alongside browser recognition when supported. If browser recognition produces text, the text is delivered as before and the backup recording is discarded without calling Gemini. If recognition ends without text, the backup audio is uploaded once to `/api/stt`; only if that fails does the UI show an actionable error. This keeps normal turns local-first while providing a recovery path for browser recognition false negatives.

## Trade-offs / validation
- The fallback STT request consumes Gemini quota only on the no-transcript path.
- Two browser capture consumers may not be supported identically by every browser/device; test on the deployed Vercel site.
- TypeScript TSX syntax transpilation passed. Full dependency-based build and live microphone testing were not available in this environment.
