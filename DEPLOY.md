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
- `VITE_SESSION_TOKEN_BUDGET` — client-side estimate used to avoid sending more requests after the session budget; default `60000`. This is a build-time public setting, not a secret.

Optional model overrides are listed in `.env.example`. Never prefix secret keys with `VITE_`; never commit `.env` or `.env.local`. **Redeploy after changing environment variables.**

## Mobile audio testing

1. Open the deployed app on the iPhone.
2. Add `?debug=1` to the URL, for example `https://lingoarena.vercel.app/?debug=1`.
3. Tap **Tap to enable sound** and accept microphone permission when asked. Confirm the phone's silent switch/mode is off and volume is up.
4. Test Chloe in Open Talk, then test the replay buttons in Speech Arena, Grammar Battle, and Fire Combo.
5. The debug panel displays audio unlock state, AudioContext state, current TTS engine, last TTS error, available browser voices, microphone state, latest API status, and provider health. Use **Refresh provider health** to run a small live check against configured providers. This uses a tiny billable provider request when a key is configured.
6. If voice is still silent, capture a screenshot of the debug panel and report iPhone model, iOS version, browser, and whether headphones/Bluetooth are connected.

The audio manager reuses one persistent `<audio playsinline>` element for cloud TTS, avoids routing speech through a Web Audio media source on iOS, and asks active capture components to release the microphone before playback. Mobile audio policy still requires a user gesture and physical-device testing; code inspection alone cannot guarantee audible output on every device.

## Provider health and fallback

`GET /api/health` returns provider statuses (`ok`, `missing_key`, `unauthorized`, `quota_exceeded`, `rate_limited`, `timeout`, or `provider_error`) without returning API keys. It makes a tiny test generation call per configured provider, so refresh it only when diagnosing.

Chat uses per-request failover: OpenAI → Gemini → local phrasebook. A failed provider is retried on the next request; there is no permanent per-session disable after one failure. The API retries a transient 429/5xx/timeout once. Local fallback is intended to remain useful without credentials, but it is a compact phrasebook and not equivalent to a live model.

## Known limitations

- Browser-based audio and MediaRecorder MIME support vary by iOS version. The code prefers `audio/mp4` on iOS when supported and WebM/Opus elsewhere.
- Hands-free capture uses the browser speech adapter with RMS-based silence detection. iOS uses MediaRecorder + `/api/stt`; the mic is released before playback. It is not a full-duplex streaming system.
- Streaming LLM tokens, sentence-streaming TTS, and the optional OpenAI Realtime/WebRTC mode are not implemented in this pass.
- Pronunciation scoring compares recognized words; it is not phoneme-level acoustic analysis.

## Root-cause assessment from code inspection

- **Mobile silence:** the previous audio manager created a `MediaElementAudioSourceNode` for the same HTML audio element used for speech and routed it through an `AudioContext` analyser. This extra Web Audio routing can be unreliable on iOS Safari. The previous flow also did not centrally ensure that recognition/recording had fully stopped before TTS playback. This pass removes that media-source routing from speech output and adds a strict stop/release-before-playback event with a short settling delay. This is a likely code-level cause, not a confirmed physical-device diagnosis; test on the actual iPhone.
- **Lite mode after a few turns:** `FreeChat` had a hard-coded `cloudTurnsRef.current >= 60` cutoff, which permanently diverted that session to the local phrasebook after the threshold. This pass removes the call-count cutoff and replaces it with a configurable, high token estimate budget (`60000` by default), reset on each new conversation. Provider errors also remain per-request so the next turn can try OpenAI again before failing over to Gemini.
