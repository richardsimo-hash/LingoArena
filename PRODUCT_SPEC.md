# LingoArena — Product and technical specification

## Product goal

LingoArena combines a gamified language-learning path with a voice-first AI tutor called Chloe. The product prioritizes speaking, listening, pronunciation practice, and natural multi-turn conversation. The visual and learning inspiration is Duolingo-style progression and BetterSpeak-style avatar conversations; this is not an affiliation with either product.

## Core product rules

- Unlimited hearts and attempts; mistakes never lock a learner out.
- No mandatory timers. Optional session durations may be selected by the learner.
- Every unit and level is accessible without prerequisite locks.
- Core learning content is local and works without API calls.
- Lessons contain at least ten varied, non-identical exercise prompts and are validated by tests.
- XP and completion indicators motivate progress but do not restrict access.

## Learning modes

### Learn Path

Five starter units are provided, with three lessons each. As XP levels increase, the path adds mixed-practice units. Each lesson generates ten exercises from local translated concepts, including multiple choice, listening choice, typed translation, fill-in-the-gap, and speaking attempts. This is expandable practice, not literally infinite unique authored content; the current source phrase bank is finite and generated units reuse it.

### Speech Arena / Pronunciation Duel

The model phrase is played when a new duel starts, with replay and slow replay controls. The learner can answer through browser speech recognition or type a fallback response. Per-word green/red feedback is based on recognized text alignment. This is transcription matching, not acoustic or phoneme-level pronunciation scoring.

### Arena Turbo

Seven difficulty selections are available. Each run has at least ten questions, with increasing prompt count and audio rate. There are no timers or heart gates.

### Grammar Battle

A target-language phrase is spoken on each round. The default is listening-first with the text hidden until requested. Incorrect responses allow unlimited retries. Replay and slow replay are available.

### Fire Combo

A dedicated listening game speaks a prompt automatically at each question. The phrase is hidden by default, with replay/slow replay, optional reveal, multiple-choice answers, and seven selectable levels. Each level has at least ten prompts.

### Open Talk / Free Talk

A Chloe avatar screen shows listening/thinking/speaking states. The user can enable hands-free mode, which attempts to restart recognition after the tutor's audio ends. The browser's single-utterance recognition path is used where available; a MediaRecorder + server STT fallback is available where configured. A text input remains available as a recovery path.

## Audio architecture

`src/lib/lingo/audio.ts` is the single shared audio manager; `src/lib/audio.ts` re-exports it for a short public import path. It provides an unlock gesture, one persistent `<audio playsinline>` element, browser speech-synthesis fallback, asynchronous voice loading, accent preferences in localStorage, TTS cache (memory + IndexedDB), and a global mute toggle. Audio playback must be tested on physical iOS and Android devices because autoplay restrictions vary by browser and operating system.

## Server-side API routes

- `POST /api/chat`: OpenAI → Gemini fallback; client-side local phrasebook if both providers fail.
- `POST /api/tts`: OpenAI TTS → Gemini audio generation → browser speech synthesis.
- `POST /api/stt`: OpenAI transcription → Gemini transcription. Audio is sent as base64 JSON to avoid multipart parsing assumptions in the serverless handler.

Provider keys are read only from server environment variables and must never be included in browser code. If providers fail or credentials are absent, the app should continue in limited mode and log the fallback reason.

## Accent preferences

Accent preference is stored per target language in localStorage. Supported UI selections include English US/UK/Australian/Indian, Spanish Spain/Mexico/Argentina/Dominican Republic, Portuguese Brazil/Portugal, French France/Canada, German Germany/Austria, Italian Italy, and Japanese Japan. Browser voices are selected only when a compatible voice is installed; cloud TTS may not perfectly honor every locale choice.

## Security and cost controls

- Keep all provider keys server-side.
- Limit text length and audio upload size.
- Use a small chat output budget and bounded conversation history.
- Cache generated TTS audio in memory and IndexedDB.
- Browser-only fallback content works without API usage.
- Avoid storing raw audio persistently.

## Known limitations

- Hands-free turn detection depends on browser speech recognition behavior and a silence-detection fallback. True streamed LLM tokens, sentence-by-sentence streaming TTS, and a dedicated low-latency full-duplex voice transport are not implemented. Users can manually tap the microphone to interrupt the tutor where the browser supports it.
- Avatar visuals are a local animated illustration, not a photorealistic video avatar; mouth animation is a CSS speaking-state effect rather than true audio-amplitude lip-sync.
- Pronunciation feedback evaluates the transcription text and does not measure phonemes, pitch, stress, or acoustic fluency.
- The source phrase bank is finite. Extra units are generated by reusing and mixing the local phrase bank, not by generating endless unique curriculum content.
- Mobile audio behavior and provider fallback behavior require device/API-key tests before being considered verified.


## Round 2: mobile audio, provider health, and hands-free reliability

### Mobile audio
- Use one persistent HTML audio element with `playsinline` for cloud TTS.
- Avoid connecting the speech player to a Web Audio `MediaElementAudioSourceNode` on iOS because that routing can be silent/unreliable on Safari.
- Before playback, emit a shared event that stops browser recognition, stops MediaRecorder, and releases active microphone tracks; wait briefly before starting TTS.
- On iOS, prefer MediaRecorder/STT over browser SpeechRecognition. Select MP4 when supported, otherwise use the browser-supported recorder format.
- Add `?debug=1` panel for audio unlock, AudioContext, TTS engine/error, voice count, mic state, API status, and `/api/health` provider status.

### Provider resilience
- Chat tries OpenAI, then Gemini, then the local phrasebook for each request. Failures do not permanently disable a provider for the rest of the session.
- Retry transient 429, 5xx, and timeout failures once. Classify authorization, quota, rate-limit, timeout, and provider failures for logs.
- The old hard-coded 60-request session cutoff has been removed. Estimated token budget is configurable and defaults to 60,000 tokens.
- `/api/health` makes small live provider checks and never returns API credentials.
- Local fallback avoids immediate phrase repetition and uses a detected keyword in its follow-up question when possible.

### Hands-free state model
- Conversation state is explicitly tracked as `idle`, `listening`, `capturing`, `thinking`, and `speaking`.
- RMS VAD calibrates a noise floor at the beginning of capture, uses a silence threshold around 1.25 seconds, ignores very short recordings, and caps recording duration at 30 seconds.
- The microphone is stopped before tutor audio and reopened after playback in hands-free mode.

### Known gaps
- The current implementation is half-duplex, not full-duplex streaming. Sentence-level streaming TTS and the optional OpenAI Realtime/WebRTC mode remain future work.
- iPhone playback must be validated on a real device; platform restrictions cannot be fully simulated by unit tests.
