# STT timeout feedback fix

## Symptoms addressed
The microphone appeared inactive after speech and then surfaced `STT_HTTP_502: gemini_stt_network_error: TimeoutError`.

## Changes
- Shared `useSpeech` hook exposes `processing` separately from `listening`.
- Browser-recognition no-result recovery now displays a visible message while the backup recording is sent to STT.
- Direct MediaRecorder transcription also displays progress while the API request is running.
- Speech Arena, Grammar Battle, Free Talk, and Learn Path render a `Transcribing…` state and disable the mic button while a transcription is pending.
- Gemini STT timeout increased from 20s to 25s, while Vercel function `maxDuration` remains 30s.
- STT output is constrained to 128 tokens with temperature 0.

## Important limitation
This mitigates silent waiting and gives the request a little more time; it does not guarantee Gemini will respond before the timeout. If the next attempt still times out, inspect Vercel function logs using the `diagnosticId` from the browser's `/debug` report. Look for `provider_request_started`, `provider_response`, and `provider_failed` for the same ID.

## Validation
- TypeScript transpilation/syntax checks passed for all six changed source files.
- Full `tsc --noEmit` could not pass in this environment because dependencies/types are incomplete (`react`, `vitest`, and `@types/node` unavailable in the working dependency tree).
- No live browser microphone test or Vercel deployment was performed.
