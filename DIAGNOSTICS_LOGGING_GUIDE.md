# LingoArena diagnostics logging (Vercel prototype)

## Purpose
Capture enough metadata to diagnose microphone/STT failures across the browser and Vercel Function without collecting raw audio, API keys, or recognized transcript content.

## Browser report
1. Deploy this build to the existing Vercel project.
2. Open `https://lingoarena.vercel.app/debug` (or append `?debug=1` to a route that displays the audio panel).
3. Reproduce the issue once: enter an activity, tap the mic, speak for 3–5 seconds, then stop.
4. Return to `/debug` and click **Copy report**.
5. Paste the JSON report into the support chat. It includes recent browser diagnostic events, request ID, HTTP status, content type, Vercel request ID when available, latency, response detail and recording metadata.

The local event ring buffer is bounded to 80 events in localStorage. Use **Clear logs** to clear it. Logs deliberately omit audio bytes, transcript text, API keys, Authorization headers, cookies and request bodies.

## Correlate with Vercel
Each STT request sends an `x-lingo-request-id` such as `stt-<uuid>`. The `/api/stt` function writes structured JSON log lines with that ID and stages such as:
- `invocation_started`
- `request_validated`
- `audio_decoded`
- `provider_request_started`
- `provider_response`
- `transcription_succeeded`
- `provider_failed`
- `unhandled_handler_error`

In Vercel → Project → Logs, filter by `/api/stt` and search the `diagnosticId` from the browser report. If the browser sees `FUNCTION_INVOCATION_FAILED` and **there is no `invocation_started` line for the matching ID**, the failure likely occurred before the handler could run (module resolution, bundling, or runtime initialization). If `invocation_started` exists, the last stage narrows the failure.

## Important limits
- Vercel platform-generated failures can occur before application code runs; no in-handler logger can record those. The browser request ID plus Vercel's own invocation logs provide the correlation path.
- The rate limiter is in-memory and per serverless instance, suitable only as best-effort prototype protection, not a global quota system.
- No deployment or live microphone test is claimed by this package.
