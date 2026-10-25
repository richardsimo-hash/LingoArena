# LingoArena chat and voice patch

Changes based on the supplied `LingoArena.zip`:

1. `api/chat.ts`: moved the best-effort per-instance rate limiter into the route, removing its shared `server/rateLimit` import. The request/response contract and provider order remain unchanged.
2. `src/lib/lingo/chat.functions.ts`: displays `details` from the existing 503 JSON response (for example `gemini=unauthorized`) so the actual provider failure is visible in the app instead of only `providers_unavailable: 503`.
3. `src/lib/voice.ts`: starts fetching the next sentence's TTS audio while the current sentence plays, reducing the sequential network wait between sentence clips.

Important:
- A 503 provider error means Gemini failed or its key was missing. This client change exposes the returned details; it cannot make invalid, missing, quota-exhausted, or unauthorized API keys work.
- The rate limiter is in-memory per function instance, as before; it is not a distributed/global rate limit.
- No changes were made to `api/tts.ts`, `api/stt.ts`, or `api/health.ts`.
- `node_modules`, `dist`, `.git`, `.vercel`, `.env`, and `.env.local` are excluded.
- Build and production behavior have not been verified in this environment.
