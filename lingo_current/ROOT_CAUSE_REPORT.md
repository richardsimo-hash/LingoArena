# LingoArena — API 500 and iPhone responsive review

## API crash: what is and is not confirmed

**Confirmed from the supplied report:** Vercel returned `FUNCTION_INVOCATION_FAILED` for an API request. That identifies a serverless function invocation failure, but it does not identify the exception that triggered it.

**Not confirmed:** The Vercel Runtime Log lines for the failing invocation were not included with the prompt. Without the exception name and stack trace, it is not responsible to attribute the production crash to one exact file/line. An import/load-time failure would happen before the handler's `try/catch`, so runtime logs are still needed even after this hardening pass.

## Confirmed code risks addressed

1. `api/tts.ts`, `api/chat.ts`, `api/stt.ts`, `api/health.ts`: handlers previously lacked a whole-handler `try/catch`. Unexpected errors after invocation could escape the handler. Each handler now logs the real error with `console.error` and returns structured JSON with a 500 status.
2. `api/tts.ts`: audio bytes were sent as a `Uint8Array`. They are now wrapped in `Buffer.from(...)` and returned with `Content-Type`, `Content-Length`, `Accept-Ranges`, and `Cache-Control`. TTS input is limited to 600 characters per request; Gemini is the only cloud provider. HTTP 429 is surfaced as a rate-limit/quota response and the client falls back to browser speech synthesis.
3. `api/chat.ts`, `api/stt.ts`, `api/tts.ts`, `api/health.ts`: explicit 30-second Vercel function duration configuration, structured method/rate-limit/provider errors, and outer exception logging were added. Secrets continue to be read from `process.env` inside handler/provider calls.
4. `vercel.json`: the SPA rewrite already excludes `/api/`; no rewrite change was needed. The `api/` directory is at repository root.
5. `index.html`: viewport metadata already uses `width=device-width, initial-scale=1, viewport-fit=cover`; no change was needed.

## Responsive overflow causes addressed from source inspection

1. `src/routes/index.tsx` header: the language selectors and stats/speed/audio/settings controls were placed in one non-wrapping horizontal row. On narrow screens, their combined minimum widths could exceed the viewport. The header now stacks into two rows on small screens; selects can shrink and controls use smaller icon sizes/gaps.
2. `src/routes/index.tsx` mobile navigation: longer translated tab labels competed for six equal-width columns and were truncated. The mobile bar now uses short labels (`Ruta`, `Arena`, `Batalla`, `Fire`, `Charla`, `Progreso`), accessible `aria-label`s, min-width-safe buttons, and hides labels below 360px while retaining icons.
3. `src/routes/index.tsx` and `src/index.css`: the app now accounts for dynamic viewport height and safe-area insets, uses responsive main padding, and includes a final horizontal-overflow safeguard. This safeguard is secondary to the header/navigation layout changes.

## Remaining verification

- No Vercel runtime stack trace was supplied; the original crash trigger remains unconfirmed.
- No live Vercel endpoint or iPhone/iPad device was accessible from this code review. Verify `/api/health`, `/api/tts`, `/api/chat`, `/api/stt`, and the listed viewport widths after deployment.
- A clean `npm ci` and build after these edits could not be completed in this environment because dependency installation timed out. The user's previous local build passed before this patch; that does not prove this updated ZIP builds. Run the commands in `DEPLOY.md` locally before deploying.
