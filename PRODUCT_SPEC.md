# LingoArena — Product Specification

## Product vision
LingoArena is a gamified language-learning app that combines a Duolingo-inspired learning path with speaking practice and conversational AI. The product prioritizes sustained practice, confidence, useful feedback, and user autonomy.

## Product principles
- Unlimited learning: no hearts, energy limits, penalties that block progress, or mandatory timers.
- All levels and lessons are accessible; recommended sequences guide rather than restrict.
- Mistakes are feedback, not punishment. Reattempts are unlimited.
- The app must distinguish speech recognition from acoustic pronunciation assessment.
- Be transparent about integrations, technical limitations, and AI-generated content.
- Keep API secrets server-side.

## Current architecture
- React 19 + TypeScript + Vite + Tailwind CSS.
- Local progress/preferences persisted in browser localStorage (`lingoarena-v1`).
- Browser Web Speech API used for speech recognition when supported.
- Browser Speech Synthesis used for reference audio and spoken assistant replies.
- `/api/chat` supports Lovable AI Gateway or OpenAI-compatible chat completion when the corresponding server-side key is configured; local fallback replies are available.
- No dedicated phoneme-level pronunciation service is currently configured. Arena de Voz compares recognized text against the expected phrase; it must not claim to measure acoustic pronunciation precisely.

## Unlimited access and progression
- Hearts are disabled as a gameplay restriction and are not displayed as a consumable resource.
- Wrong answers never reduce a life or lock a lesson.
- No mandatory timers in lessons or Turbo mode.
- All visible units and lessons can be opened directly.
- The learning path includes the five curated units plus mixed-practice units that expand with XP level. Mixed-practice units currently remix the existing phrase bank; they do not yet constitute genuinely infinite unique AI-generated linguistic content.
- Future improvement: generate validated, level-appropriate content from a server-side AI provider and persist it to avoid repetition, while providing offline fallback content.

## Learning path
- Five curated units cover greetings, cafés/food, directions/transport, shopping/hotels, and health/emergencies.
- Three lessons per unit; progress is tracked per target language.
- Additional mixed-practice units become visible as XP level grows.
- Lesson items remain accessible regardless of completion state.
- Preserve progress across refreshes using localStorage.

## Arena de Voz
- Browser speech recognition transcribes the user's spoken response where supported.
- `compareSpeech` compares normalized recognized text to the target phrase and highlights matched/mismatched words.
- Correct responses are shown with green feedback; mismatches with red feedback and an immediate retry.
- Users can type a response when speech recognition is unavailable or blocked.
- A transcription match is not equivalent to an acoustic pronunciation score. Phoneme, stress, intonation, and accent scoring require a dedicated assessment provider.
- Technical recording/recognition errors should be reported as technical errors rather than linguistic failures.

## Arena Turbo
- Seven selectable challenge levels, from words and short expressions through advanced expressions.
- Higher levels increase question count and adjust reference speech rate; longer phrases are prioritized when available.
- Each run has a finite challenge set, but users can replay indefinitely and there is no countdown timer.
- Content depth is limited by the existing phrase bank until dynamic content generation is integrated.

## Charla Libre
- Conversations have an unlimited-time option selected by default; optional 3-, 5-, and 10-minute sessions remain available.
- AI replies use the existing `/api/chat` endpoint when credentials are configured, otherwise local fallback replies are used.
- Hands-free mode automatically starts a new one-turn speech-recognition session after the avatar finishes speaking, where browser speech recognition is supported.
- The current avatar is an emoji/persona with speaking/listening/thinking visual states, not a photorealistic animated avatar with lip synchronization.
- The browser speech APIs are not equivalent to a low-latency full-duplex speech-to-speech service. Barge-in, robust voice activity detection, and high-quality lip synchronization require further integration.
- The user can stop hands-free mode, use manual microphone input, or type.

## Turbo levels
1. Words & basics.
2. Short phrases.
3. Everyday sentences.
4. Longer sentences.
5. Natural expressions.
6. Spontaneous speaking.
7. Advanced challenge.

These are challenge labels and difficulty heuristics, not a formal CEFR assessment.

## Privacy and security
- Microphone access requires browser permission and should be visibly indicated.
- Private AI API keys must be stored in server-side environment variables, never frontend code.
- Avoid storing raw audio unless a future feature explicitly requires it and user controls are provided.
- AI and browser speech integrations can fail; provide retry/fallback behavior.

## Acceptance criteria
- No heart counter or heart depletion blocks learning.
- Every incorrect response can be retried without waiting.
- No timer is required in the learning path or Turbo.
- Units remain open and progress persists.
- Arena de Voz provides green/red transcript-based feedback and a retry path.
- Turbo offers seven directly selectable levels.
- Charla Libre defaults to no time limit and offers hands-free turn-taking when supported.
- The UI communicates technical limitations honestly.

## Known limitations / next steps
1. Add automated tests for unlimited progression, Turbo level generation, and hands-free state transitions.
2. Replace the small curated phrase bank with validated dynamic content generation and duplicate detection.
3. Integrate a dedicated pronunciation-assessment service if phoneme-level feedback is required.
4. Consider a real-time speech API for more natural turn-taking and interruption handling.
5. Add a synchronized animated avatar only after selecting a provider or animation stack.
6. Test on Chrome, Safari, Firefox, mobile browsers, and browsers without Web Speech support.
