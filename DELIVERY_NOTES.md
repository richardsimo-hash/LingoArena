# LingoArena Round 2 — delivery notes

## Changes
- Added `api/health.ts` for live OpenAI/Gemini status checks without exposing credentials.
- Reworked `api/chat.ts` for per-request provider failover, transient retries, short spoken responses, estimated token-budget validation, and short-lived response caching.
- Updated `src/lib/audio.ts` to avoid MediaElementAudioSource routing for speech, coordinate mic release before playback, and expose audio/API debug state.
- Updated `src/components/lingo/ui.tsx` for iOS MediaRecorder-first capture, supported MIME selection, adaptive RMS VAD, audio-release handling, and the debug panel.
- Added `src/lib/lingo/useHandsFreeConversation.ts` for explicit idle/listening/capturing/thinking/speaking states.
- Updated `src/components/lingo/FreeChat.tsx` to remove the fixed 60-turn cutoff and resume hands-free listening after tutor playback.
- Updated `src/lib/lingo/chat.functions.ts` to surface request/provider status.
- Updated `.env.example`, `DEPLOY.md`, `PRODUCT_SPEC.md`, and `CHANGELOG.md`.

## Root-cause assessment
- **Mobile silence (likely, unconfirmed until iPhone testing):** the previous player routed speech through `MediaElementAudioSourceNode` and `AudioContext`; some iOS Safari audio paths become silent or unreliable with that route. The previous capture/playback sequence also lacked a central microphone release barrier. This pass removes that route and adds stop/release-before-playback coordination.
- **Lite mode after many turns:** `FreeChat` hard-coded a 60-call cutoff (`cloudTurnsRef.current >= 60`) and then used local responses for the remainder of the session. This pass removes the call cutoff and adds a configurable estimated token budget, default 60,000.

## Validation
- Source changes were reviewed and static configuration files were checked.
- A full build and live iPhone audio acceptance test must still be run in an environment with dependencies installed and on a physical iPhone. Do not treat mobile audio as verified until tested on-device.

## Commit message
`fix: improve iOS audio playback and per-request AI provider failover`


## Round 3 diagnostics and root-cause work

- Added `ROOT_CAUSE_REPORT.md` with true/false/not-verifiable findings against the Round 2 source.
- Reworked the audio unlock to use a valid locally generated WAV, a persistent visible-to-media but visually hidden audio element, successful playback-event verification, `navigator.audioSession` where available, explicit error state, and a confirmation beep.
- Added `/debug` and `?debug=1` diagnostics with independent sound/browser TTS/cloud TTS/chat/microphone tests and copyable diagnostics.
- Added richer `/api/health` status/model/runtime reporting.
- Removed hard client/server session-budget rejection to prevent budget estimates from forcing local mode.
- Build/lint remain unverified because dependency installation did not complete in this environment.

- Updated Gemini defaults after checking the current official model lifecycle: `gemini-2.0-flash` was shut down on June 1, 2026. New defaults are `gemini-3.8-flash` for chat/STT and `gemini-3.8-flash-tts` for TTS. Existing Vercel overrides must be updated or removed.
- Added best-effort per-instance rate limiting to `/api/chat`, `/api/tts`, `/api/stt`, and `/api/health`.

## Round 3 files touched or added

- `src/lib/audio.ts`
- `src/components/lingo/ui.tsx`
- `src/components/lingo/DebugPanel.tsx` (new)
- `src/main.tsx`
- `src/components/lingo/FreeChat.tsx`
- `src/lib/lingo/chat.functions.ts`
- `api/chat.ts`
- `api/health.ts`
- `api/tts.ts`
- `api/stt.ts`
- `server/rateLimit.ts` (new)
- `vercel.json`
- `package.json`
- `.env.example`
- `README.md`
- `DEPLOY.md`
- `ROOT_CAUSE_REPORT.md` (new)
- `DELIVERY_NOTES.md`
