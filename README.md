# LingoArena

A gamified language-learning app built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- Open learning path with curated units and expandable mixed-practice units.
- Unlimited attempts; mistakes do not consume hearts or block access.
- Arena de Voz with browser speech transcription and word-level comparison feedback.
- Arena Turbo with seven selectable, untimed challenge levels.
- Charla Libre with optional session durations and hands-free turn-taking when browser speech recognition is supported.
- Browser text-to-speech for reference phrases and spoken conversation replies.
- Local persistence of preferences, XP, streaks, and lesson progress.

## Development

```bash
npm install
npm run dev
```

## Tests and production build

```bash
npm test
npm run build
```

## AI conversation backend

The `/api/chat` endpoint supports either `LOVABLE_API_KEY` (Lovable AI Gateway) or `OPENAI_API_KEY` (OpenAI-compatible chat completions). Configure the key as a server-side environment variable in the deployment provider. Do not add private keys to frontend code or commit them to Git.

If no key is configured, Charla Libre falls back to simple local replies.

## Known limitations

- Speech feedback is based on browser speech-to-text transcription and text comparison. It is not phoneme-level acoustic pronunciation assessment.
- Hands-free conversation uses browser Web Speech APIs and does not yet provide full-duplex low-latency speech, robust barge-in, or a photorealistic lip-synced avatar.
- Mixed-practice units currently remix the curated phrase bank. Truly novel infinite content requires a validated AI content-generation integration.
- Browser speech recognition availability varies by browser and device. Typing and manual microphone controls remain available as fallbacks.

See [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) for the expanded product specification and roadmap.
