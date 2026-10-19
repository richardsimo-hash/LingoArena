# Changes prepared in this update

## Learning access
- Removed heart depletion as a gameplay mechanic and removed the heart counter from the main navigation and statistics.
- Mistakes no longer consume lives or block retries.
- Added mixed-practice units that expand as the learner gains XP levels. These currently remix the existing phrase bank.

## Speaking and Turbo
- Arena Turbo now has seven selectable, untimed challenge levels with varying question counts and speech rates.
- Arena de Voz retains word-level green/red transcript comparison and supports retrying with typed input when speech recognition is unavailable.
- Grammar/listening practice allows repeated attempts instead of ending after a second mistake.

## Free conversation
- Unlimited duration is the default; optional timed sessions remain available.
- Added a hands-free toggle that automatically opens a new browser speech-recognition turn after the avatar finishes speaking, where supported.
- Improved conversation prompt instructions to encourage context-aware follow-up questions.

## Documentation
- Added `PRODUCT_SPEC.md` describing architecture, acceptance criteria, known limitations, and next steps.
- Reworked `README.md` with setup, build/test commands, API-key handling, and limitations.

## Limitations
- Automated build/tests could not be completed in this environment because the uploaded project did not contain a complete installed dependency tree and package installation did not finish. Run `npm install`, `npm test`, and `npm run build` locally before merging.
- Pronunciation scoring remains transcription-based, not phoneme-level acoustic assessment.
- Hands-free mode relies on browser Web Speech APIs and is not a full-duplex real-time voice stack.
- The current avatar is an emoji/persona display; synchronized animated lip movement requires a separate integration.
