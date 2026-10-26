import { CEFR_LEVELS, NODES_PER_UNIT, type NativeLang } from "./content";
import type { State } from "./store";
import { UI_ORDER } from "./i18n";

/** Numbers the achievement rules look at, computed from the saved state. */
export type ProgressFacts = {
  lessons: number; languages: number; fullUnits: number; levelsDone: number;
  mastered: number; reviews: number; streak: number; xp: number; goalDays: number; chatTurns: number;
};

export function progressFacts(s: State): ProgressFacts {
  let lessons = 0, languages = 0, fullUnits = 0, levelsDone = 0, mastered = 0;
  for (const p of Object.values(s.progress)) {
    if (!p) continue;
    const done = new Set(p.done);
    lessons += done.size;
    if (done.size) languages++;
    const unitsDone = new Set<number>();
    for (const idx of done) {
      const unit = Math.floor(idx / NODES_PER_UNIT);
      if (Array.from({ length: NODES_PER_UNIT }, (_, n) => done.has(unit * NODES_PER_UNIT + n)).every(Boolean)) unitsDone.add(unit);
    }
    fullUnits = Math.max(fullUnits, unitsDone.size);
    levelsDone = Math.max(levelsDone, CEFR_LEVELS.filter((b) => Array.from({ length: b.last - b.first + 1 }, (_, i) => unitsDone.has(b.first + i)).every(Boolean)).length);
    mastered += Object.values(p.srs ?? {}).filter((c) => c.box === 5).length;
  }
  const goalDays = Object.values(s.dailyXp).filter((xp) => xp >= s.dailyGoal).length;
  return { lessons, languages, fullUnits, levelsDone, mastered, reviews: s.reviewsDone, streak: s.streak, xp: s.xp, goalDays, chatTurns: s.chatTurns };
}

/** Titles in UI_ORDER: en, es, fr, de, it, pt. */
type Achievement = { id: string; emoji: string; title: [string, string, string, string, string, string]; unlocked: (f: ProgressFacts) => boolean };

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_lesson", emoji: "🌱", title: ["First lesson", "Primera lección", "Première leçon", "Erste Lektion", "Prima lezione", "Primeira lição"], unlocked: (f) => f.lessons >= 1 },
  { id: "lessons_10", emoji: "📗", title: ["10 lessons", "10 lecciones", "10 leçons", "10 Lektionen", "10 lezioni", "10 lições"], unlocked: (f) => f.lessons >= 10 },
  { id: "lessons_50", emoji: "📚", title: ["50 lessons", "50 lecciones", "50 leçons", "50 Lektionen", "50 lezioni", "50 lições"], unlocked: (f) => f.lessons >= 50 },
  { id: "lessons_150", emoji: "🏛️", title: ["150 lessons", "150 lecciones", "150 leçons", "150 Lektionen", "150 lezioni", "150 lições"], unlocked: (f) => f.lessons >= 150 },
  { id: "first_unit", emoji: "🧩", title: ["Unit complete", "Unidad completa", "Unité terminée", "Einheit geschafft", "Unità completata", "Unidade completa"], unlocked: (f) => f.fullUnits >= 1 },
  { id: "level_done", emoji: "🎓", title: ["Level complete", "Nivel completado", "Niveau terminé", "Niveau geschafft", "Livello completato", "Nível concluído"], unlocked: (f) => f.levelsDone >= 1 },
  { id: "first_review", emoji: "🧠", title: ["First review", "Primer repaso", "Première révision", "Erste Wiederholung", "Primo ripasso", "Primeira revisão"], unlocked: (f) => f.reviews >= 1 },
  { id: "reviews_25", emoji: "🔁", title: ["25 reviews", "25 repasos", "25 révisions", "25 Wiederholungen", "25 ripassi", "25 revisões"], unlocked: (f) => f.reviews >= 25 },
  { id: "mastered_10", emoji: "⭐", title: ["10 phrases mastered", "10 frases dominadas", "10 phrases maîtrisées", "10 Sätze gemeistert", "10 frasi padroneggiate", "10 frases dominadas"], unlocked: (f) => f.mastered >= 10 },
  { id: "mastered_100", emoji: "🌟", title: ["100 phrases mastered", "100 frases dominadas", "100 phrases maîtrisées", "100 Sätze gemeistert", "100 frasi padroneggiate", "100 frases dominadas"], unlocked: (f) => f.mastered >= 100 },
  { id: "streak_3", emoji: "🔥", title: ["3-day streak", "Racha de 3 días", "Série de 3 jours", "3-Tage-Serie", "Serie di 3 giorni", "Sequência de 3 dias"], unlocked: (f) => f.streak >= 3 },
  { id: "streak_7", emoji: "🚀", title: ["7-day streak", "Racha de 7 días", "Série de 7 jours", "7-Tage-Serie", "Serie di 7 giorni", "Sequência de 7 dias"], unlocked: (f) => f.streak >= 7 },
  { id: "streak_30", emoji: "🏆", title: ["30-day streak", "Racha de 30 días", "Série de 30 jours", "30-Tage-Serie", "Serie di 30 giorni", "Sequência de 30 dias"], unlocked: (f) => f.streak >= 30 },
  { id: "goal_7", emoji: "🎯", title: ["Daily goal ×7", "Meta diaria ×7", "Objectif du jour ×7", "Tagesziel ×7", "Obiettivo giornaliero ×7", "Meta diária ×7"], unlocked: (f) => f.goalDays >= 7 },
  { id: "xp_1000", emoji: "💎", title: ["1,000 XP", "1000 XP", "1 000 XP", "1.000 XP", "1.000 XP", "1000 XP"], unlocked: (f) => f.xp >= 1000 },
  { id: "chat_10", emoji: "💬", title: ["10 chat replies", "10 respuestas en la charla", "10 réponses au chat", "10 Gesprächsbeiträge", "10 risposte in chat", "10 respostas na conversa"], unlocked: (f) => f.chatTurns >= 10 },
  { id: "polyglot", emoji: "🌍", title: ["Polyglot", "Políglota", "Polyglotte", "Polyglott", "Poliglotta", "Poliglota"], unlocked: (f) => f.languages >= 2 },
];

export function achievementTitle(a: Achievement, native: NativeLang) {
  return a.title[Math.max(0, UI_ORDER.indexOf(native))] || a.title[0];
}

/** Achievements earned but not yet recorded in state (to announce them once). */
export function newlyUnlocked(s: State): string[] {
  const facts = progressFacts(s);
  return ACHIEVEMENTS.filter((a) => a.unlocked(facts) && !s.achievements.includes(a.id)).map((a) => a.id);
}
