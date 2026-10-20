# LingoArena

Voice-first, gamified language learning with unlimited practice, a Duolingo-inspired learning path, Speech Arena, Turbo levels, Grammar Battle, Fire Combo, and an AI conversation screen with the tutor Chloe.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Cloud AI/voice integrations use server-side Vercel routes and optional `OPENAI_API_KEY` / `GEMINI_API_KEY` environment variables. Without credentials, lessons remain available offline, browser speech synthesis is used when possible, and Open Talk falls back to a local phrasebook.

## Checks

```bash
npm run validate:content
npm test
npm run build
```

See [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) for architecture and known limitations and [DEPLOY.md](./DEPLOY.md) for Vercel setup. Mobile audio must be verified on real iOS Safari and Android Chrome devices.


## Mobile audio diagnostics

Open `/debug` or append `?debug=1` to the app URL. Run each sound/chat/microphone test independently and use **Copy report** to capture device diagnostics. See `ROOT_CAUSE_REPORT.md` for source-inspection findings and `DEPLOY.md` for Vercel configuration.
