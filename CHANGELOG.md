# LingoArena update — 2026-10-20

## Learning access and content
- Removed heart depletion as a gameplay mechanic; hearts are no longer displayed or consumed.
- Wrong answers do not end rounds. Exercises offer immediate retries, and users may continue without penalty.
- All units and levels remain accessible without prerequisites or mandatory timers.
- Expanded each lesson to ten varied offline exercises: choose, listening choice, typed translation, fill-in-the-gap, and speaking attempts.
- Added test validation for unique lesson prompts and at least ten questions in each Turbo and Fire Combo level.
- Arena Turbo now offers seven selectable levels, each with at least ten questions and increasing speech rate/difficulty.
- Added Fire Combo as a dedicated listening game with automatic prompt playback, hidden-by-default text, replay/slow replay, and seven levels.

## Audio, speech, and AI
- Added one global audio manager at `src/lib/audio.ts`; the legacy `src/lib/lingo/audio.ts` path re-exports it.
- The manager primes a persistent `playsinline` audio element, unlocks audio from user gestures, waits for asynchronous browser voices, supports mute/unmute, applies per-language accent preferences, and caches TTS audio in memory and IndexedDB.
- Added cloud TTS (`/api/tts`) with OpenAI → Gemini fallback and browser speech-synthesis fallback.
- Added speech transcription (`/api/stt`) with OpenAI → Gemini fallback; browser Web Speech is preferred, with MediaRecorder + silence detection as fallback where available.
- Added chat provider fallback (`/api/chat`): OpenAI → Gemini → client-side local phrasebook. Keys remain server-side.
- Free Talk now defaults to unlimited duration, has hands-free turn-taking where browser speech recognition supports it, a Chloe call-style avatar screen, mute and audio-unlock controls, and cloud-audio amplitude-based mouth animation when available.
- Added a rolling context summary and a soft per-session cloud chat budget; local phrasebook replies keep the session usable in lite mode.

## Documentation and deployment
- Added `PRODUCT_SPEC.md`, `.env.example`, and `DEPLOY.md`.
- Updated `README.md` and package scripts so `npm run build` validates content, type-checks, and builds the Vite app.
- `.env.example` is explicitly allowed by `.gitignore`; real `.env` files remain ignored.

## Verification status and limitations
- All TypeScript/TSX source files passed a syntax-transpilation check; `package.json` and `package-lock.json` parse as valid JSON.
- Full `npm test` and `npm run build` could not be completed in this environment because npm registry packages were unavailable and `npm ci` did not finish. Run the documented checks locally before merging.
- Real iOS Safari and Android Chrome acceptance tests were not possible here.
- Cloud TTS is sentence-by-sentence after the LLM reply is received, but LLM token streaming is not implemented. The hands-free loop depends on browser recognition/recording behavior; a dedicated full-duplex real-time voice transport is not implemented.
- The avatar is a stylized local illustration, not a photorealistic video avatar. Cloud audio amplitude drives mouth movement where browser audio analysis is available; browser speech synthesis uses a CSS animation fallback.
- Pronunciation feedback compares recognized words with the expected phrase. It is not a phoneme-level acoustic assessment of accent, stress, or intonation.
- Dynamic units remix the local phrase bank; the current bank is finite and does not generate endless unique authored curriculum content.


## Round 2 — mobile audio and provider resilience
- Removed Web Audio media-source routing from speech playback to reduce iOS Safari silence/routing issues.
- Added microphone-release-before-playback coordination and iOS MediaRecorder-first speech capture.
- Added `/api/health` provider diagnostics and `?debug=1` mobile debug panel.
- Removed the fixed 60-turn lite-mode cutoff and introduced configurable 60k estimated token budget.
- Added per-request OpenAI → Gemini failover, transient retry, response caching, concise spoken output, and improved local fallback.
- Added explicit hands-free conversation state machine and adaptive RMS noise-floor calibration.

## Grammar Battle microphone fix
- Use one-shot speech recognition in Grammar Battle so final transcripts resolve after the learner pauses.
- Automatically evaluate the final recognized transcript; retain interim text in the answer field.
- Display a listening hint during microphone capture.


## 2026-10-25 — Shared microphone transcription fix

- Fixed the shared `useSpeech()` Stop handler: graceful `SpeechRecognition.stop()` now finalizes the transcript instead of discarding it via `abort()`.
- Fixed MediaRecorder stop flow to allow final audio chunks to be delivered before stream cleanup and STT upload.
- Added a visible no-speech message if recognition finishes without a transcript.
- Applies across Grammar Battle, Speech Arena, Free Talk, and Learn Path.
- See `VOICE_INPUT_ROOT_CAUSE_AND_FIX.md` for validation and deployment limitations.


## 2026-10-25 — Prefer cloud STT for desktop microphone input
- Prefer MediaRecorder uploads to Gemini STT over native Web Speech on browsers that support recording.
- Keep native recognition as a fallback and surface empty recordings explicitly.


## 2026-10-25 — Gemini TTS 429 fallback
- Treat Gemini TTS HTTP 429 as a provider rate-limit event rather than a fatal audio error in the global status banner.
- Add a bounded 30–300 second client cooldown (default 60 seconds) to avoid repeated TTS requests while rate-limited.
- During cooldown, shared speech playback falls back to browser speech synthesis; logs retain a diagnostic message.
- This does not increase Gemini quota or fix STT; it prevents TTS rate limiting from unnecessarily interrupting supported playback.


## 2026-10-25 — Local-first Vercel prototype build
- Browser TTS is now the default; cloud TTS is opt-in via `lingoarena-cloud-tts=enabled` in localStorage.
- Browser speech recognition is preferred to avoid Gemini STT usage on supported browsers; recorded-audio `/api/stt` remains fallback when Web Speech recognition is unavailable.
- Free Talk routes greetings and ordinary short turns to the local phrasebook; explicit complex tutoring requests are routed to Gemini.
- Added `LOCAL_FIRST_VERCEL_BUILD.md` with behavior, opt-in instructions, and deployment notes.


## 2026-10-25 — STT no-speech recovery
- Added a temporary MediaRecorder backup while browser speech recognition runs.
- If browser recognition ends without text, the app attempts one Gemini `/api/stt` transcription of the captured audio before showing a no-speech error.
- Normal browser-recognized turns discard the backup and do not call cloud STT, preserving the local-first usage policy.
- Improved recovery when browser recognition fails to start by stopping the backup recorder.


## 2026-10-25 — STT HTTP 500 diagnostics
- STT client now reads the JSON/text error response and surfaces safe server details instead of only `STT_HTTP_500`.
- Added an explicit empty-recording check and a 1.4 MB audio payload guard to reduce serverless request-body failures.
- STT route now returns structured provider failure details and preserves Gemini 429 as a rate-limit response.
- These changes improve diagnosis and error handling; they do not by themselves prove the deployed 500 root cause.

## 2026-10-25 — Cross-layer STT diagnostics
- Added bounded privacy-conscious browser diagnostic events persisted in localStorage and included in `/debug` → Copy report.
- Added a per-request diagnostic ID sent as `x-lingo-request-id`; capture HTTP status, response content type, Vercel request ID, latency and sanitized error details.
- Added structured JSON server logs for STT invocation and provider stages; do not log audio payloads, API keys, or recognized transcript text.
- Removed `/api/stt`'s import of `../server/rateLimit` and inlined a small best-effort limiter to reduce a possible function module-resolution failure before invocation.
- Added `DIAGNOSTICS_LOGGING_GUIDE.md` with steps to correlate browser report and Vercel function logs.

## 2026-10-25 — STT timeout feedback and latency mitigation
- Added a visible transcription/recovery state across Speech Arena, Grammar Battle, Free Talk, and Learn Path so the microphone no longer appears to do nothing while `/api/stt` is processing.
- Prevented the microphone button from starting a second capture while transcription is in progress.
- Increased the Gemini STT fetch timeout to 25 seconds within the configured 30-second Vercel function duration and constrained transcription output to 128 tokens with deterministic generation settings.
- Kept diagnostic request IDs and structured client/server logging.
- Note: the provider timeout may still occur; if it does, correlated diagnostic logs should identify whether the request reached Gemini and how long it took.
