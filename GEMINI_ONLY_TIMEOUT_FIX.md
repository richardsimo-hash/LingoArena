# LingoArena — Gemini-only timeout fix

## What changed
- Removed OpenAI API calls and `OPENAI_API_KEY` checks from the chat, health, text-to-speech, and speech-to-text API routes. The server-side API routes now use Gemini only; browser-native speech synthesis/recognition remain the client fallback where already supported.
- Chat uses `GEMINI_API_KEY` or `GEMINI_KEY` and defaults to `gemini-3.5-flash-lite`, Google’s low-latency, cost-effective Flash-Lite model. The Gemini 3.x sampling `temperature` parameter was removed from the request.
- Increased the Gemini chat request timeout from 12 seconds to 25 seconds and the Vercel route duration setting from 30 to 60 seconds. The route still retries one transient timeout, then returns an explicit `gemini_unavailable` error with `details.gemini`.
- Updated `/api/health` to report only Gemini, including configured key-name source without revealing the key.

## Validation performed
- TypeScript check of `api/chat.ts`, `api/health.ts`, `api/tts.ts`, `api/stt.ts`, and `server/rateLimit.ts`: passed.
- Mocked Gemini success test using only `GEMINI_KEY` and no OpenAI key: passed.
- Mocked Gemini timeout test: retried once, returned `details.gemini = "timeout"`, and made no OpenAI requests: passed.
- ZIP integrity check: performed before delivery.

## Limits
These tests use mocked HTTP responses. They do not verify the actual Google API key, Google free-tier quota, Vercel production environment, or a live deployment. I cannot read secret values from the user's Vercel environment in this chat. The environment variable must be named `GEMINI_API_KEY` or `GEMINI_KEY` in the production deployment. Do not paste the key into chat.

## Deploy and verify
1. Apply the ZIP's files to the connected GitHub repository and deploy the production branch to Vercel.
2. In Vercel, confirm the production environment contains `GEMINI_API_KEY` or `GEMINI_KEY`. If you change environment variables, redeploy.
3. Open `/api/health` on the deployed site. Check `configured.gemini`, `keySource.gemini`, `providers.gemini`, and `models.geminiChat`.
4. Try Free Talk. If it still fails, share the JSON from `/api/health` and the chat error details, but never share the key itself.

Gemini can still time out due to temporary upstream latency, network conditions, model availability, or an oversized prompt/context. The new timeout/model defaults reduce one likely cause but cannot guarantee that Google's service will always respond in time.


## Follow-up fix: Gemini TTS 429 / quota handling
- `/api/tts` now returns HTTP 429 for Gemini rate limits/quota exhaustion (rather than disguising it as a generic HTTP 502) and includes `fallback: "browser_speech_synthesis"` plus `Retry-After`. No automatic TTS retry is made for a 429.
- Successful clips are cached in the warm server instance for 30 minutes, with an 80-entry cap; duplicate concurrent requests for the same phrase are coalesced. This cache is best-effort and not persistent across serverless instances.
- The client stops issuing further cloud TTS requests for the remaining sentences as soon as one cloud request fails, then speaks the remaining text using browser-native speech synthesis.
- Validation: API TypeScript check passed; mocked 429 test passed (one Gemini request only, HTTP 429 + browser fallback); missing-key test passed (503 and no provider request). Live Google quota and production deployment are not accessible from this test.
