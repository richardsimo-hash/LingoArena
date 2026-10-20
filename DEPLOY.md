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

- `OPENAI_API_KEY` — enables OpenAI chat, TTS, and transcription.
- `GEMINI_API_KEY` — fallback for chat, TTS, and transcription.
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

Chat uses per-request failover: OpenAI → Gemini → local phrasebook. A failed provider is retried on the next request; there is no permanent per-session disable after one failure. The API retries a transient 429/5xx/timeout once. Local fallback is intended to remain useful without credentials, but it is a compact phrasebook and not equivalent to a live model. API routes include best-effort in-memory per-instance rate limiting; use a shared store if you need strict distributed limits across serverless instances.

## Known limitations

- Browser-based audio and MediaRecorder MIME support vary by iOS version. The code prefers `audio/mp4` on iOS when supported and WebM/Opus elsewhere.
- Hands-free capture uses the browser speech adapter with RMS-based silence detection. iOS uses MediaRecorder + `/api/stt`; the mic is released before playback. It is not a full-duplex streaming system.
- Streaming LLM tokens, sentence-streaming TTS, and the optional OpenAI Realtime/WebRTC mode are not implemented in this pass.
- Pronunciation scoring compares recognized words; it is not phoneme-level acoustic analysis.

## Root-cause assessment from code inspection

See `ROOT_CAUSE_REPORT.md` for item-by-item findings against the Round 2 source. The two confirmed code defects were (1) an invalid empty WAV plus an `unlocked` flag set even when playback had failed, and (2) client/server token-budget hard stops that could force local fallback. Actual iPhone playback and live provider configuration still require physical-device and deployed-environment testing.
