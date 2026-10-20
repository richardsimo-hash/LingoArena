# Delivery notes

## Suggested commit message

feat: improve LingoArena voice learning, unlimited practice, and AI fallbacks

This update removes heart-based learning restrictions, adds ten varied offline exercises per lesson, expands Turbo and Fire Combo levels, improves mobile-safe shared audio playback, adds accent preferences and cloud TTS/STT routes with OpenAI/Gemini fallbacks, improves hands-free conversation with the Chloe avatar, and documents setup, environment variables, testing, and known limitations.

## Main files changed or added

- `src/lib/audio.ts` — shared audio manager, mobile unlock, persistent audio element, cloud TTS cache, accent selection, mute state, amplitude events, speech recognition helpers.
- `src/lib/lingo/audio.ts` — compatibility re-export to the shared manager.
- `src/components/lingo/ui.tsx` — MediaRecorder/STT fallback, silence detection, global sound controls.
- `src/components/lingo/LearnPath.tsx` — ten varied offline exercises per lesson and retry behavior.
- `src/components/lingo/SpeechArena.tsx` — automatic model phrase playback, Turbo levels with at least ten questions and retries.
- `src/components/lingo/GrammarBattle.tsx` — unlimited retries.
- `src/components/lingo/FireCombo.tsx` — new listening game with seven levels and automatic prompt playback.
- `src/components/lingo/FreeChat.tsx` — Chloe avatar call UI, hands-free turns, rolling context, accent preference, lite-mode messaging.
- `src/components/lingo/Settings.tsx` — per-language accent selector.
- `src/routes/index.tsx` — Fire Combo navigation and global audio controls.
- `src/index.css` — avatar mouth animation.
- `src/test/content.test.ts` — exercise uniqueness and level-count validation.
- `api/chat.ts` — OpenAI/Gemini chat fallback and tutor system prompt.
- `api/tts.ts` — OpenAI/Gemini TTS fallback.
- `api/stt.ts` — OpenAI/Gemini transcription fallback.
- `package.json` — validation and type-checking build steps.
- `.gitignore` — allow `.env.example` while ignoring real environment files.
- `.env.example`, `DEPLOY.md`, `PRODUCT_SPEC.md`, `README.md`, `CHANGELOG.md` — setup and architecture documentation.
