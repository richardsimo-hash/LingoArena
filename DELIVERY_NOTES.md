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
