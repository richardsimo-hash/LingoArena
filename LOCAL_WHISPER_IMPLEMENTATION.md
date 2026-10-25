# LingoArena local-first speech recognition

## What changed
- Added `src/lib/localWhisper.ts`, which loads Transformers.js lazily and runs a Whisper ONNX model in the browser.
- `src/lib/voice.ts` now attempts on-device transcription first, then uses the existing `/api/stt` route only if local inference cannot initialize or returns no usable transcript.
- `src/components/lingo/ui.tsx` shows user-facing status messages while the local model loads and while audio is processed.
- The English-only tiny model is selected for `en*` locales; the multilingual tiny model is selected otherwise.

## First use and privacy
- The inference itself runs in the browser on the user's device; the recorded audio is not sent to `/api/stt` when local transcription succeeds.
- The JS library and model are downloaded on first use from jsDelivr/Hugging Face. A network connection is required for that initial download. Browser caching may allow later use without a connection, but persistence depends on browser cache/storage policies.
- If local inference fails, the current implementation falls back to the existing cloud STT route. Therefore this is local-first, not a strict offline-only mode. The fallback is logged as `cloud_fallback_started` in diagnostics.
- Model loading can be resource-intensive, especially on iPhones. Test on real iOS and Android devices before claiming support or offline readiness.

## Validation status
- TypeScript check (`tsc --noEmit`) passed.
- Content tests/build could not run in this environment because the preinstalled node_modules is missing `@rollup/rollup-linux-x64-gnu` (Rollup optional dependency). This is an environment/dependency issue, not a successful test result.
- No live microphone, real device, CDN/model download, or deployed Vercel test was performed here.

## Recommended next validation
1. `npm ci` in a clean environment, then `npm run build`.
2. Deploy a preview.
3. Test on iPhone Safari and Android Chrome with a short English phrase.
4. Confirm diagnostics show `local_transcription_succeeded` and no `cloud_fallback_started` event when local inference works.
5. After the model has loaded, test again offline. Do not claim offline support unless the cached model succeeds.
