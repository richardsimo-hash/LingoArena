# LingoArena deployment and mobile audio diagnostics

## Local development

```bash
npm install
cp .env.example .env.local
npm run validate:content
npm test
npm run build
npm run dev
```

## Vercel environment variables

In Vercel → Project → Settings → Environment Variables, configure server-side secrets:

- `GEMINI_API_KEY` — Gemini chat, TTS, and transcription. `GEMINI_KEY` is also accepted for compatibility. No OpenAI key is used or required.
- `SESSION_TOKEN_BUDGET` — server-side estimated session input budget; default `60000`.
- `SESSION_TOKEN_BUDGET` — informational estimated token budget displayed by diagnostics; it does not block requests.

Optional model overrides are listed in `.env.example`. Gemini defaults are set to `gemini-3.8-flash` for chat/STT and `gemini-3.8-flash-tts` for TTS. Google shut down `gemini-2.0-flash` on June 1, 2026; if those old model IDs are explicitly set in Vercel, update or delete the overrides. See Google's [model deprecations](https://ai.google.dev/gemini-api/docs/deprecations) and [TTS model documentation](https://ai.google.dev/gemini-api/docs/speech-generation). Never prefix secret keys with `VITE_`; never commit `.env` or `.env.local`. **Redeploy after changing environment variables.**

## Mobile audio testing

1. Open the deployed app on the iPhone.
2. Open `https://lingoarena.vercel.app/debug` for the full diagnostics page, or add `?debug=1` to any app URL for the overlay.
3. Tap **Enable sound**. If it fails, the unlock error is shown. Confirm silent mode is off and volume is up.
4. Run each test separately: **Test sound**, **Test browser voice**, **Test cloud voice**, **Test chat**, and **Test microphone**.
5. Review provider health, model names, HTTP status, audio session state, user agent, and the last 20 audio logs. Use **Copy report** to copy the report into a message.
6. `/api/health` can also be opened directly in the browser. It makes a small billable provider request for each configured provider.
7. If voice is still silent, share the copied report plus iPhone model, iOS version, browser, and whether headphones/Bluetooth are connected.

The audio manager reuses one persistent `<audio playsinline>` element for cloud TTS, avoids routing speech through a Web Audio media source on iOS, and asks active capture components to release the microphone before playback. Mobile audio policy still requires a user gesture and physical-device testing; code inspection alone cannot guarantee audible output on every device.

## Provider health and fallback

`GET /api/health` returns provider statuses (`ok`, `missing_key`, `unauthorized`, `quota_exceeded`, `rate_limited`, `timeout`, or `provider_error`) without returning API keys. It makes a tiny test generation call per configured provider, so refresh it only when diagnosing.

Chat uses Gemini only and falls back to the local phrasebook if Gemini is unavailable. TTS uses Gemini only and falls back to browser speech synthesis on failure. HTTP 429 is surfaced as a rate-limit/quota response; it is not retried by the TTS route. Successful generated clips are cached in memory per warm Vercel instance, and duplicate concurrent requests for the same clip are coalesced. This cache is best-effort and not persistent. Local fallback is useful without credentials but is not equivalent to a live model. API routes include best-effort in-memory per-instance rate limiting.

## Known limitations

- Browser-based audio and MediaRecorder MIME support vary by iOS version. The code prefers `audio/mp4` on iOS when supported and WebM/Opus elsewhere.
- Hands-free capture uses the browser speech adapter with RMS-based silence detection. iOS uses MediaRecorder + `/api/stt`; the mic is released before playback. It is not a full-duplex streaming system.
- Streaming LLM tokens, sentence-streaming TTS, and the optional OpenAI Realtime/WebRTC mode are not implemented in this pass.
- Pronunciation scoring compares recognized words; it is not phoneme-level acoustic analysis.

## Root-cause assessment from code inspection

See `ROOT_CAUSE_REPORT.md` for item-by-item findings against the Round 2 source. The two confirmed code defects were (1) an invalid empty WAV plus an `unlocked` flag set even when playback had failed, and (2) client/server token-budget hard stops that could force local fallback. Actual iPhone playback and live provider configuration still require physical-device and deployed-environment testing.

## iPhone voice diagnostics (round 4)
After deploying, open `https://YOUR-DOMAIN/ios-audio-test` on the iPhone and tap each test separately (A–F). Use **Copy report** to capture the exact results. Also open `https://YOUR-DOMAIN/?debug=1` to see the shared audio overlay. These tests are diagnostic only; actual iPhone results must be collected on the device.

No OpenAI environment variable is required. Configure `GEMINI_API_KEY` or `GEMINI_KEY` in the Vercel Production environment for cloud AI. After changing files, push the complete project root and wait for a successful Vercel build before testing the deployed routes.

## API 500 and responsive-layout verification (this patch)

1. In Vercel → Project → Settings → Environment Variables, set `GEMINI_API_KEY` (or `GEMINI_KEY`) for **Production**. Set optional model overrides only if you intend to override `.env.example`. Do not add `VITE_` to secret names.
2. Push the complete project root and wait for the new deployment to finish successfully. Confirm the deployment commit matches the commit you pushed.
3. Open `https://YOUR-DOMAIN/api/health` directly. It should return JSON with `ok`, `providers`, `models`, `runtime`, and `configured`. If it returns `FUNCTION_INVOCATION_FAILED`, open Vercel → Project → Logs / Runtime Logs and copy the exception plus stack trace for the failing function. The generic HTTP 500 page alone cannot establish the root cause.
4. Open `https://YOUR-DOMAIN/debug` and run Test chat, Test cloud voice, and provider health. The client falls back to browser speech when `/api/tts` returns non-2xx or non-audio content.
5. On iPhone/iPad, test the app at CSS viewport widths 320, 360, 375, 390, 393, 412, and 430 px, in portrait and landscape. Verify header controls fit, all six bottom tabs remain accessible, and content is not covered by the Safari toolbar. Repeat with larger text enabled.
6. To test API functions, run a real chat request from the debug page and a cloud TTS test. `/api/health` alone does not prove that audio bytes can be generated or played.

## Build gate

Run from the repository root before deployment:

```bash
npm ci
npm run build
npm run lint
```

Deploy only if all three commands exit with code 0. The current delivery environment could not complete `npm ci` due to a dependency-install timeout, so this ZIP has not been build-verified after its latest changes.
