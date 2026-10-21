# Delivery notes — API 500 hardening + responsive layout

## Changed files
- `api/tts.ts` — whole-handler error handling, 30s duration config, 600-character input cap, Buffer-based audio response, structured provider failures.
- `api/chat.ts` — whole-handler error handling, 30s duration config, structured method/rate-limit/provider failures.
- `api/stt.ts` — whole-handler error handling, 30s duration config, structured validation/provider failures.
- `api/health.ts` — whole-handler error handling, 30s duration config, structured JSON response.
- `src/routes/index.tsx` — responsive two-row mobile header, compact selectors/stats, safe-area handling, short accessible bottom-nav labels.
- `src/index.css` — viewport-safe root sizing, mobile text/input defaults, dynamic viewport support, narrow-screen nav label behavior and overflow safeguard.
- `ROOT_CAUSE_REPORT.md` — evidence-based findings and explicit unconfirmed items.
- `DEPLOY.md` — deployment and runtime verification steps.

## Files to delete
None identified. No routes or source files were renamed or made obsolete.

## Root cause caveat
The supplied symptom `FUNCTION_INVOCATION_FAILED` alone is not a stack trace. The exact production exception cannot be proven without Vercel Runtime Logs. This patch makes handler-time exceptions return JSON and logs them, but cannot catch an import/load-time crash that happens before handler invocation.

## Validation
The earlier version passed the user's local `npm run build` and `npm run lint`. This updated package could not be clean-installed and built in the current sandbox because `npm ci` timed out. Therefore this delivery is **not build-verified after these edits**; run `npm ci && npm run build && npm run lint` from the project root before deploying.
