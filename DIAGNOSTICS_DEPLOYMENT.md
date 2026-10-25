# LingoArena runtime diagnostics

## What this adds
- Browser warnings/errors are stored locally and also POSTed (metadata only) to `/api/diagnostics`.
- The endpoint redacts sensitive fields and writes JSON events to Vercel Function Logs.
- No audio bytes, transcript text, API keys, request bodies, or credentials are sent by the diagnostics uploader.
- The endpoint is rate-limited. It is an ingest endpoint only; it does not expose logs publicly.

## How to view events on Vercel
1. Deploy this code to the same Vercel project serving LingoArena.
2. Open Vercel Dashboard → project → Logs (or Runtime Logs, depending on dashboard layout).
3. Filter by `/api/diagnostics` or search for `"app":"lingoarena"` and `"route":"/api/diagnostics"`.
4. Reproduce a speech failure. Search the timestamp and correlate `/api/diagnostics` client events with `/api/stt` server events using the diagnostic ID when present.
5. For a browser-side report, open `/debug` and use **Copy report**; this contains local events and timing data but no audio or transcript text.

## Important limitations
- Vercel logs are not retrievable from this public endpoint. This avoids exposing diagnostic data to anyone on the internet.
- The assistant cannot query a private Vercel project directly unless an authorized Vercel connector/API integration is configured. This patch makes events available in Vercel logs; it does not grant the assistant account access.
- Current runtime logs are retained according to your Vercel plan/project settings.
- Run `npm ci` and `npm test`/`npm run build` in a clean CI environment before production. In the supplied environment tests cannot start because `@rollup/rollup-linux-x64-gnu` is missing from the included `node_modules` optional dependencies.
