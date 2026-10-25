# STT HTTP 500 diagnostics

The previous client only displayed `STT_HTTP_500`, hiding the response body. This patch reads and displays the server response detail, adds an audio payload guard, and returns structured Gemini STT failures from `/api/stt`.

If the next deployment still returns HTTP 500, inspect Vercel Functions logs for `/api/stt` at the same timestamp. If the response is a platform-generated `FUNCTION_INVOCATION_FAILED`, the handler may not have executed; if JSON includes `details`, that detail narrows the provider/runtime cause.

No deployment or live microphone test was performed as part of this patch.
