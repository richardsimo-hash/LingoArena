/** ISO week helpers for the weekly leaderboard (weeks start on Monday). */
export function isoWeek(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** XP earned in the ISO week containing `date`, from the per-day XP record. */
export function weeklyXp(dailyXp: Record<string, number>, date = new Date()): number {
  const week = isoWeek(date);
  return Object.entries(dailyXp).reduce((sum, [day, xp]) => {
    const [y, m, d] = day.split("-").map(Number);
    return isoWeek(new Date(y!, m! - 1, d!)) === week ? sum + xp : sum;
  }, 0);
}
