# LingoArena Local-First Prototype Build

## Goal
Keep the existing React + Vite + TypeScript application on Vercel, while avoiding Gemini API calls for routine learning interactions.

## Changes in this build
- Browser speech synthesis is the default for all routine playback. It does not call `/api/tts` by default.
- Optional cloud TTS testing can be enabled in this browser by setting `localStorage.setItem("lingoarena-cloud-tts", "enabled")`; disable with `localStorage.removeItem("lingoarena-cloud-tts")`. Cloud TTS diagnostics remain available.
- Browser speech recognition is preferred when supported. `/api/stt` remains the fallback for browsers without a recognition API. Note: Web Speech recognition is browser/vendor provided and is not guaranteed to run fully offline.
- Free Talk uses its local phrasebook for greetings and ordinary short conversation turns. Requests containing explicit tutoring intents (explain, correct, grammar, compare, translate, detailed analysis, etc.) or long prompts are routed to Gemini.
- The existing Gemini chat fallback and bounded recent-history logic remain.
- Existing 429 cooldown/fallback, shared graceful mic stop, and other combined fixes are retained.

## Vercel deployment
No additional service or database is required. Keep the existing Vercel project and Gemini server-side environment variable. Do not expose the API key in Vite/client environment variables.

## Verification limitations
This package is source-ready, but a full build must be run in an environment with dependencies installed (`npm ci && npm run build && npm test`). Browser microphone behavior must be tested on the actual target browsers. The Web Speech API can depend on browser/vendor services; it is not a promise of offline speech recognition.
