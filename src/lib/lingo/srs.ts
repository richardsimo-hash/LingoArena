/**
 * Leitner spaced repetition. Each learned phrase sits in one of five boxes; a correct review moves
 * it up a box (longer gap before it comes back), a miss drops it to box 1 (due again today).
 * Pure functions over plain objects so the schedule is easy to test and to store in localStorage.
 */
export type Box = 1 | 2 | 3 | 4 | 5;
export type Card = { box: Box; due: number; lapses: number };
export type Deck = Record<string, Card>;

/** Days until the next review after landing in box 1..5. */
export const INTERVALS: Record<Box, number> = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };
/** A review is offered after this many finished lessons. */
export const LESSONS_PER_REVIEW = 3;
/** Phrases per review session (each appears in one or two of its 10 exercises). */
export const REVIEW_SIZE = 6;

/** Local calendar day number, so "due tomorrow" flips at the learner's midnight. */
export function dayNumber(date = new Date()): number {
  return Math.floor((date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000);
}

/** Adds newly learned phrases to box 1. `weak` ones (missed in the lesson) are due today. */
export function introduce(deck: Deck, ids: string[], today: number, weak: string[] = []): Deck {
  const next = { ...deck };
  for (const id of ids) {
    if (next[id]) { if (weak.includes(id)) next[id] = { ...next[id]!, box: 1, due: today }; continue; }
    next[id] = { box: 1, due: weak.includes(id) ? today : today + INTERVALS[1], lapses: 0 };
  }
  return next;
}

/** Records one review answer for a phrase. */
export function grade(deck: Deck, id: string, correct: boolean, today: number): Deck {
  const card = deck[id] ?? { box: 1 as Box, due: today, lapses: 0 };
  const box = (correct ? Math.min(5, card.box + 1) : 1) as Box;
  return { ...deck, [id]: { box, due: correct ? today + INTERVALS[box] : today, lapses: card.lapses + (correct ? 0 : 1) } };
}

export function dueIds(deck: Deck, today: number): string[] {
  return Object.entries(deck)
    .filter(([, card]) => card.due <= today)
    .sort(([, a], [, b]) => a.due - b.due || a.box - b.box || b.lapses - a.lapses)
    .map(([id]) => id);
}

/**
 * Phrases for one review: everything due (most overdue, lowest box first), topped up with the
 * weakest not-yet-due phrases so a review after every few lessons is never empty.
 */
export function pickReview(deck: Deck, today: number, size = REVIEW_SIZE): string[] {
  const due = dueIds(deck, today);
  if (due.length >= size) return due.slice(0, size);
  const rest = Object.entries(deck)
    .filter(([id]) => !due.includes(id))
    .sort(([, a], [, b]) => a.box - b.box || b.lapses - a.lapses || a.due - b.due)
    .map(([id]) => id);
  return [...due, ...rest].slice(0, size);
}

export function deckStats(deck: Deck, today: number) {
  const cards = Object.values(deck);
  return { learned: cards.length, due: cards.filter((c) => c.due <= today).length, mastered: cards.filter((c) => c.box === 5).length };
}
