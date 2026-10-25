# Microphone / speech-to-text follow-up fix

## Evidence from the user's diagnostics
- Audio unlock, browser voice, cloud voice, chat, health, and a generic microphone test all passed.
- The report did not demonstrate that a spoken phrase was transcribed or passed to an activity callback.
- In the user's desktop Chrome environment, the previous shared `useSpeech()` hook preferred native `SpeechRecognition`. That path can start and stop without delivering a final result; when it does, every activity depending on the shared hook appears unresponsive.
- `beep_playback_timeout` originates in the local beep playback test in `src/lib/voice.ts`; it is an audio confirmation/beep issue, not an STT response. It can coexist with the transcription issue and should not be mistaken for a successful or failed transcription request.

## Changes
- Prefer MediaRecorder + `/api/stt` (Gemini) on browsers that support both, including desktop Chrome.
- Retain Web Speech as a fallback if cloud transcription fails, not as the first choice on desktop.
- Display an explicit error if the recorder finishes with an empty audio blob instead of silently returning.
- Because Grammar Battle, Speech Arena, Free Talk, and Learn Path share `useSpeech()`, this change applies across all four.

## Validation limits
- Source-level checks and ZIP integrity are run for this package.
- This environment cannot reach GitHub or install missing npm dependencies, so the latest remote `main` cannot be freshly compared, a complete `npm run build` cannot be confirmed, and a live browser microphone test has not been performed.
- This ZIP is not pushed to GitHub and is not deployed to Vercel.
