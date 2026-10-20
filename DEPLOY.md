# LingoArena deployment notes

## 1. Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The keys are optional for the static learning content and browser speech synthesis. Cloud chat, cloud TTS, and server-side STT require at least one supported provider key.

## 2. Vercel environment variables

1. Open the LingoArena project in Vercel.
2. Go to **Settings → Environment Variables**.
3. Add `OPENAI_API_KEY` and/or `GEMINI_API_KEY` as server-side environment variables.
4. Optionally add model overrides from `.env.example`.
5. Do not prefix these secrets with `VITE_` and never commit `.env` or `.env.local`.
6. Redeploy the project after saving the variables.

## 3. Validation and build

```bash
npm run validate:content
npm test
npm run build
```

The build runs content validation, TypeScript checking, and the Vite production build. The automated checks cannot verify physical-device audio behavior; test on real iOS Safari and Android Chrome devices as well.

## 4. Speech behavior and fallback

- Cloud TTS tries OpenAI first and Gemini second; if both fail, the browser's `speechSynthesis` is used.
- Chat tries OpenAI first, then Gemini. If neither is available, the client uses a local phrasebook.
- Speech recognition prefers the browser Web Speech API. Where it is unavailable, audio recording can be submitted to `/api/stt` if a provider key is configured.
- Microphone permission and audible playback still depend on browser/device policy. Use the visible **Tap to enable sound** control if audio has not been unlocked by a gesture.
- The current phrase matching is not a phoneme-level pronunciation assessment. It compares recognized words with the expected phrase.
