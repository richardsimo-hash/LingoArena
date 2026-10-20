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
