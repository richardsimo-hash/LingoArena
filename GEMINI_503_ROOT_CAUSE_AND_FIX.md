# Gemini 503 / local mode — root cause and fix

## Finding from repository inspection
The deployed source checked on GitHub reads only `process.env.GEMINI_API_KEY` in `/api/chat`, `/api/health`, `/api/tts`, and `/api/stt`. The project history says the environment variable configured in Vercel was named `GEMINI_KEY`. If that is the variable present in the Production environment, the API routes ignore it, so chat cannot reach Gemini and returns `providers_unavailable` (503). This is a concrete configuration-name mismatch supported by source inspection; it is not proof that no other upstream error exists if the key name was later changed.

## Fix in this patch
- Resolve Gemini credentials from `GEMINI_API_KEY` **or** `GEMINI_KEY` in chat, health, TTS, and STT.
- `/api/health` reports which variable name was detected, without returning the key.
- Chat provider diagnostics retain a short error message for 400/401/403/404/429/5xx responses instead of reducing every failure to generic `provider_error`.

## Deployment verification steps
1. Deploy this ZIP to the same Vercel project/Production branch.
2. Open `/api/health`. Expect `configured.gemini: true`, `keySource.gemini: "GEMINI_KEY"` if that is the variable configured, and `providers.gemini: "ok"` if the key/model/quota are valid.
3. Test Free Talk with a new message. A successful request should return `provider: "gemini"` in the network response.
4. If health shows `configured.gemini: true` but `providers.gemini` is not `ok`, use the returned provider status and the `details.gemini` value from `/api/chat` to distinguish invalid key, quota/rate limit, model access, or upstream failure. Do not share the API key itself.

## Validation limits
This environment has no network access to invoke the live Google API or query Vercel runtime logs, so no claim is made that the live production endpoint was tested. The patch is validated with source assertions and TypeScript checks where possible; production behavior must be confirmed after deployment.
