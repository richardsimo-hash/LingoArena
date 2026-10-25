# V10 TTS function fix

This patch corrects the Gemini 3.8 text-to-speech request to use Google's documented `/v1beta/interactions` endpoint and audio response shape, instead of sending a Gemini TTS request through `generateContent` with a mismatched response schema.

It also makes `api/tts.ts` self-contained (no runtime import from `server/rateLimit.ts`), imports Node's `Buffer` explicitly, adds explicit response returns, and logs provider errors without logging secrets. If providers fail, the API returns structured JSON rather than relying on a generic platform error.

## Before deploying

Run:

```bash
npm ci
npm test
npm run build
```

Then deploy and test `/api/tts` through the app. If Vercel still returns `FUNCTION_INVOCATION_FAILED`, inspect the runtime logs for the new `[LingoArena TTS]` message or a cold-start/import error.
