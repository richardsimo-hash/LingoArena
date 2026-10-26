import { useEffect, useState } from "react";
import { leaveLeaderboard, loadLeaderboard, saveWeeklyXp, type BoardRow } from "@/lib/auth";
import { makeT } from "@/lib/lingo/i18n";
import type { Lingo } from "@/lib/lingo/store";
import type { CloudSync } from "@/lib/lingo/sync";
import { isoWeek, weeklyXp } from "@/lib/lingo/weekly";
import { Btn, Card } from "./ui";
import { cn } from "@/lib/utils";

/** Opt-in weekly XP leaderboard (Supabase). Hidden when sign-in is not configured. */
export function Leaderboard({ lingo, cloud }: { lingo: Lingo; cloud: CloudSync }) {
  const { s, update } = lingo;
  const t = makeT(s.native);
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [error, setError] = useState("");
  const week = isoWeek();
  const myXp = weeklyXp(s.dailyXp);
  const account = cloud.account;

  useEffect(() => {
    if (!account || !s.leaderboardOptIn) return;
    let active = true;
    // Publish my weekly XP, then load the board.
    void saveWeeklyXp(account.id, week, s.name || account.name, myXp)
      .then(() => loadLeaderboard(week))
      .then((data) => { if (active) { setRows(data); setError(""); } })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : String(e)); });
    return () => { active = false; };
  }, [account, s.leaderboardOptIn, myXp, week, s.name]);

  if (!cloud.configured) return null;
  return (
    <Card className="space-y-3">
      <h3 className="text-xl font-extrabold">🏆 {t("leaderboard")}</h3>
      {!account ? <p className="text-sm text-muted-foreground">{t("signInToCompete")}</p>
        : !s.leaderboardOptIn ? <>
          <p className="text-xs text-muted-foreground">{t("leaderboardHint")}</p>
          <Btn className="w-full" onClick={() => update({ leaderboardOptIn: true })}>{t("joinLeaderboard")}</Btn>
        </> : <>
          {error && <p className="text-xs font-bold text-destructive">{error}</p>}
          <ol className="space-y-1">
            {(rows ?? []).map((row, i) => (
              <li key={row.user_id} className={cn("flex items-center gap-3 rounded-xl px-3 py-2", row.user_id === account.id ? "bg-accent font-extrabold" : "bg-muted")}>
                <span className="w-6 text-right font-extrabold">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{row.display_name}{row.user_id === account.id && ` (${t("you")})`}</span>
                <span className="font-bold">{row.xp} XP</span>
              </li>
            ))}
          </ol>
          <button onClick={() => { update({ leaderboardOptIn: false }); void leaveLeaderboard(account.id, week); setRows(null); }} className="text-xs font-bold text-muted-foreground underline">{t("leaveLeaderboard")}</button>
        </>}
    </Card>
  );
}
