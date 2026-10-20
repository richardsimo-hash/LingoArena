# LingoArena Round 3 — Root-cause investigation (repository inspection)

**Baseline used:** `LingoArena-round2-updated.zip` from the prior conversation. No fresh repository ZIP was attached with the Round 3 prompt, so the findings below describe this baseline and cannot prove the state of the live Vercel deployment.

## 1A. Mobile voice output

1. **Handler attached / overlay: PARTLY TRUE / live overlay NOT VERIFIABLE.** `src/components/lingo/ui.tsx` used a real `<button onClick>` handler, so it was not a clickable `<div>` problem. A physical iPhone overlay/z-index test is not possible from source alone.
2. **Await before first play: FALSE in the old unlock path.** `src/lib/audio.ts` invoked `audio.play()` before its first `await`, although it did other synchronous setup first.
3. **Persistent element reuse: FALSE as a cause.** `persistentPlayer()` returned one module-level element and both unlock and cloud playback reused it. The element was styled `display:none`, which is a risky choice for iOS media playback.
4. **Invalid silent clip / swallowed rejection: TRUE.** The old WAV data URI had a zero-length data chunk. Playback errors were caught and only logged at info level.
5. **Unlocked flag set without successful playback: TRUE.** The old code assigned `unlocked = !!audio || !!c` after `Promise.allSettled`, even if `audio.play()` had rejected or no `playing` event occurred. This could hide the banner while audio remained locked.
6. **React re-render resetting state: FALSE.** Audio state was module-scoped, not held only in component state.
7. **Audio session mode: TRUE (missing).** The old code did not set `navigator.audioSession.type = 'playback'` when available. TTS itself used the HTML audio element; Web Audio was used for effects/analyser behavior.
8. **Mic and playback overlap: TRUE (race possible).** `prepareForPlayback()` dispatched a stop event and slept 350 ms, but the capture listener stopped tracks without acknowledging the release, and recognition/recorder stop could still be asynchronous.
9. **`/api/tts` response: CODE VALIDATION MISSING; LIVE RESPONSE NOT VERIFIABLE.** The client accepted any successful response as a blob and did not check `Content-Type`. Whether the deployed endpoint returns audio or an HTML/JSON error requires `/debug` or live endpoint testing.
10. **Empty voice list fallback: FALSE as a complete blocker.** `waitForVoices()` timed out and `browserSpeak()` could still use the browser default voice when no matching voice was returned. iOS synthesis can still fail independently.

## 1B. Lite mode / provider availability

1. **SPA rewrite swallowing API: FALSE by source configuration, LIVE ROUTING NOT VERIFIABLE.** `vercel.json` already excluded `/api/` in its negative-lookahead rewrite. API handlers were at the repository root in `/api`, the expected Vercel location. The live response content type must be checked to prove routing.
2. **Routes not deployed / crashing: NOT VERIFIABLE from local source.** `api/chat.ts`, `api/tts.ts`, `api/stt.ts`, and `api/health.ts` existed at root with default Vercel handler exports. Deployment logs and direct HTTP checks are required to prove runtime health.
3. **Environment variables: CODE FALSE / LIVE CONFIG NOT VERIFIABLE.** Server handlers read `process.env.OPENAI_API_KEY` and `process.env.GEMINI_API_KEY`; they did not read secrets from `import.meta.env`. The actual Production environment values and whether Vercel was redeployed cannot be inspected from this ZIP.
4. **Client/server budget hard stop: TRUE.** `FreeChat.tsx` threw `session_token_budget_exceeded` when its client estimate crossed `VITE_SESSION_TOKEN_BUDGET`; `api/chat.ts` also returned 429 when the server estimate crossed `SESSION_TOKEN_BUDGET`. These could force local mode irrespective of provider health if a budget value was low or estimates diverged. Round 3 removes both hard stops; budget remains informational.
5. **Sticky lite flag: FALSE in source.** `FreeChat.tsx` reset the offline flag after a successful `chatReply`, and `chatReply` sent a request each turn. Provider failures were per-request, not permanently disabled.
6. **Model IDs: TRUE for the Gemini fallback.** The default `GEMINI_CHAT_MODEL` and `GEMINI_STT_MODEL` were `gemini-2.0-flash`. Google's official deprecation schedule says Gemini 2.0 Flash was shut down on June 1, 2026, before this project review date. That means the Gemini fallback can fail with a model-not-found error whenever OpenAI is unavailable or fails. The TTS default was also an older Gemini 2.5 preview model. Defaults have been updated to `gemini-3.8-flash` and `gemini-3.8-flash-tts`; if old model values are explicitly set in Vercel environment variables, remove/update them and redeploy. Source: https://ai.google.dev/gemini-api/docs/deprecations and https://ai.google.dev/gemini-api/docs/speech-generation.
7. **Quota failover: PARTLY IMPLEMENTED.** `api/chat.ts` tried Gemini after OpenAI failure, but returned mostly compact error labels rather than enough raw diagnostic information. The updated debug tests expose status, content type, response body and provider for the failing request. Real quota behavior requires valid provider credentials to test.

## Changes made in Round 3

- Replace the empty WAV with a valid locally generated PCM WAV.
- Do not mark audio unlocked until the persistent element emits a successful playback event and the play promise resolves.
- Keep the persistent media element attached but visually hidden rather than `display:none`.
- Set `navigator.audioSession.type = 'playback'` where supported.
- Add visible unlock errors and audible confirmation beep.
- Coordinate capture release and playback with a release event and settling delay.
- Validate cloud TTS response status and `Content-Type`.
- Add `/debug` page and `?debug=1` diagnostic overlay with separate sound, browser TTS, cloud TTS, chat and microphone tests, provider health, user agent, audio-session state and copyable report.
- Remove client/server hard budget rejection. Budget is now telemetry only.
- Add provider model names, runtime metadata and `model_not_found` classification to `/api/health`.
- Update Gemini defaults from shut-down `gemini-2.0-flash` / older preview TTS to current documented `gemini-3.8-flash` and `gemini-3.8-flash-tts` model IDs.
- Add best-effort in-memory request rate limits to chat, TTS, STT, and health routes.

## Limits

Source inspection cannot verify iPhone hardware/silent-switch behavior, live Vercel environment variables, deployed function routing, or real provider quota. The full dependency installation did not complete in this environment; run the documented build and lint commands before merging.
