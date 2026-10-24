# LingoArena curriculum update — implementation status

## Included in this update
- A 100-unit curriculum catalog with unique English titles, emoji, CEFR level, learning objective, and six lesson slots per unit.
- CEFR mapping: units 1–10 A1, 11–25 A2, 26–50 B1, 51–80 B2, 81–90 C1, 91–100 C2.
- Learn Path displays the 100 distinct unit titles and six lessons per unit instead of wrapping the same five unit titles.
- Multiple-choice options now request one correct option plus four distractors (five total where the option pool allows it).
- Updated content tests check the catalog size, unit-title uniqueness, lesson count, and option count.

## Important limitation — not yet a fully authored 100-unit course
The source project currently contains translated phrase-bank content for only five units (45 concepts) and seven target languages. This update adds the 100-unit curriculum map and UI scaffolding; it does **not** include 6,000 unique, reviewed exercises per language. For units 6–100, the current implementation uses an offline fallback drawn from the existing phrase bank, so vocabulary can repeat. A follow-up implementation is required to generate, validate, cache, and review language-specific lesson packs for all 100 units (and to ensure Japanese content is natural and level-appropriate). Do not market this ZIP as complete 42,000-question content.

## Validation
This ZIP was assembled from the supplied LingoArena source archive. A production build/deployment was not run or verified in this environment.
