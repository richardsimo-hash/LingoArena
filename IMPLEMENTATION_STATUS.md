# LingoArena curriculum and Free Talk update — implementation status

## Findings verified in the supplied archive

- `src/lib/lingo/content.ts`: the static phrase data defines five units × nine concepts (45 concepts total), and the `UNITS` array originally had only five units.
- `src/components/lingo/LearnPath.tsx`: `buildLessonExercises` originally wrapped `unit % UNITS.length`; the unit list UI also selected `UNITS[ui % UNITS.length]`. Both made later progression recycle earlier content. Its distractor list used `.slice(0, 3)`, producing four choices including the correct answer.
- `src/components/lingo/FireCombo.tsx`: its multiple-choice builder also used `.slice(0, 3)`, producing four choices.
- `src/components/lingo/FreeChat.tsx`: client request history was limited to the last 12 messages and its prompt sent short history.
- `api/chat.ts`: server history was limited to 12 messages, each message to 800 characters, and prompt requested 2–4 sentences.

## Changes in this archive

- Added a 30-unit curriculum metadata map with distinct themes, grammar focus, vocabulary bands and CEFR bands.
- Removed the modulo wraparound for unit display and exercise composition. Units beyond the authored static pool are labelled as generated/adaptive practice rather than pretending to be another authored unit.
- Added `MIN_OPTIONS = 5`; Learn Path and Fire Combo now select at least five options (six for B2/C1 Learn Path). Added content tests for option count, uniqueness and CEFR/difficulty/skill/topic metadata.
- Added CEFR, difficulty, skill and topic tags to generated Learn Path exercise objects.
- Expanded Free Talk history to 24 messages, added selectable conversation modes, and updated Chloe's system prompt for more specific, natural, non-repetitive conversation.
- Increased server history to 24 turns, message cap to 1,800 characters, rolling summary cap to 1,800 characters, and made output-token budget configurable with a cap of 1,800. Added the `exercise-json` prompt mode while preserving the normal `{ text, provider, ... }` API response shape.

## Important limitations — not to be mistaken for completed acceptance

- The supplied static phrase bank still contains only 45 concepts across the five authored units. The remaining curriculum entries are metadata and adaptive practice placeholders; they are **not** 25 fully authored units with ten unique high-quality questions per lesson.
- The exercise-generation API mode is available as a server route capability but is not yet wired into a client-side generation/cache/history pipeline. Thus true never-repeat behavior after the static pool is exhausted, IndexedDB caching, background prefetch, retry/backoff and adaptive mastery promotion remain incomplete.
- Free Talk has conversation-mode selection and expanded context, but the locally stored learner profile is only a small initial profile, not a fully learned profile with interest and recurring-error extraction. Sentence-by-sentence streaming TTS was not changed to protect the existing audio flow.
- `npm ci` could not complete in the provided execution environment, and the installed dependency tree was incomplete. Consequently `npm run validate:content` and the full `npm run build` could not be run successfully here. A global TypeScript syntax-transpilation pass succeeded, but this is **not** a substitute for a complete build/typecheck.

## Validation status

- Curriculum metadata entries: 30.
- Authored static units with phrase rows: 5.
- Static concepts: 45.
- Learn Path exercise template count: 10 per lesson.
- Intended minimum options: 5; six at B2/C1 in Learn Path.
- TypeScript/TSX syntax transpilation: passed for source files.
- `npm ci`: blocked/timed out in this environment.
- `npm run validate:content`: not run successfully because Vitest was unavailable after dependency installation failed.
- `npm run build`: not verified; do not treat this archive as build-certified.
