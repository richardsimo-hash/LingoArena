# Live transcript patch notes

## Changes in this patch
- Learn Path now passes `setLiveTranscript` as the interim callback to `useSpeech` and renders the transcript while `speech.listening` is true.
- Local Whisper library import uses a pinned esm.sh bundle and wraps module-load errors with `LOCAL_STT_LIBRARY_LOAD_FAILED` for diagnostics.

## Important platform limitation
This patch only displays real-time interim text when the browser exposes a working `SpeechRecognition` / `webkitSpeechRecognition` implementation. The existing fallback on browsers without that API records audio and runs Whisper after stop; it is not streaming. This patch does NOT implement streaming Whisper inference on iOS Safari. Do not describe it as full cross-browser real-time transcription.

## Validation
- `tsc --noEmit`: passed.
- `npm test` / `npm run build`: could not start Vitest because the supplied `node_modules` is missing optional dependency `@rollup/rollup-linux-x64-gnu`.
- No real microphone/device test or deployment performed.
