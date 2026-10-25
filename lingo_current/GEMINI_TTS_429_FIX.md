# Gemini-only TTS rate-limit fix

## Code changes
- All server API routes use Gemini only; no OpenAI API calls or `OPENAI_API_KEY` checks remain in `api/` or `src/`.
- `/api/tts` returns HTTP 429 with a specific `gemini_tts_rate_limited` or `gemini_tts_quota_exhausted` error when Gemini responds with 429. It includes `Retry-After` and `fallback: "browser_speech_synthesis"` instead of wrapping rate limits in a generic 502.
- TTS does not retry Gemini 429 responses. The client switches the remaining sentence chunks to browser-native speech synthesis after the first failed cloud request, avoiding repeated quota-consuming calls in the same utterance.
- Successful TTS clips are cached for 30 minutes (up to 80 entries) per warm Vercel instance, and duplicate concurrent requests for the same phrase are coalesced. This is best-effort, in-memory caching; Vercel instances do not share it.
- The backend accepts `GEMINI_API_KEY` or the compatibility alias `GEMINI_KEY`.

## Validation
- TypeScript check for the API routes (`api/chat.ts`, `api/health.ts`, `api/tts.ts`, `api/stt.ts`, and `server/rateLimit.ts`): passed.
- Mocked TTS HTTP 429 integration test: passed; the route makes one Gemini request, returns 429 with a browser fallback and `Retry-After`, and does not retry.
- Mocked missing-key test: passed; returns 503 without calling a provider.
- Full application TypeScript check (`tsc --noEmit`): passed before packaging.
- Full Vite/Vitest build could not be verified in this environment because the available copied `node_modules` archive was incomplete (missing the Rollup Linux optional dependency). This is an environment/dependency limitation, not a passing build claim.
- No live Google API key/quota or Vercel deployment was accessed. Live production behavior still needs verification after deployment.

## Deploy
1. Apply these project files to the root of the GitHub repository and commit/push to the branch connected to Vercel.
2. Confirm Vercel Production has `GEMINI_API_KEY` or `GEMINI_KEY`, then redeploy.
3. Test `/api/health` and the cloud-voice test. When Gemini TTS is rate-limited, the API may still return 429, but the app should continue speaking through browser speech synthesis when the browser supports it.
