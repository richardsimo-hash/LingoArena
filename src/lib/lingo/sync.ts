import { useCallback, useEffect, useRef, useState } from "react";
import { authConfigured, loadCloudState, saveCloudState, signIn, signOut, watchAccount, type Account, type AuthProvider } from "@/lib/auth";
import { logDiagnostic } from "@/lib/diagnostics";
import type { Card, Deck } from "./srs";
import { sanitize, type LangProgress, type Lingo, type State } from "./store";

/**
 * Combines this device's state with the account's cloud copy without losing work:
 * finished lessons are united, each review card keeps the further-along copy, scores take the
 * maximum, the streak comes from whichever device was active last, and settings (name,
 * languages, persona, speed, theme) come from whichever side changed them most recently.
 */
export function mergeStates(local: State, remote: State): State {
  const newerSettings = remote.settingsAt > local.settingsAt ? remote : local;
  const older = newerSettings === remote ? local : remote;
  const latestActive = (remote.lastActive ?? "") > (local.lastActive ?? "") ? remote : local;
  const progress: State["progress"] = {};
  for (const lang of new Set([...Object.keys(local.progress), ...Object.keys(remote.progress)]) as Set<keyof State["progress"]>) {
    const a: LangProgress = local.progress[lang] ?? { done: [], completed: 0 };
    const b: LangProgress = remote.progress[lang] ?? { done: [], completed: 0 };
    const done = [...new Set([...a.done, ...b.done])].sort((x, y) => x - y);
    const srs: Deck = { ...(b.srs ?? {}) };
    for (const [id, card] of Object.entries(a.srs ?? {})) srs[id] = pickCard(card, srs[id]);
    const placed = [a.placedUnit, b.placedUnit].filter((u): u is number => typeof u === "number");
    progress[lang] = { done, completed: done.length, srs, sinceReview: Math.max(a.sinceReview ?? 0, b.sinceReview ?? 0), placedUnit: placed.length ? Math.max(...placed) : undefined, placementSeen: Boolean(a.placementSeen || b.placementSeen) };
  }
  return {
    ...older,
    ...newerSettings,
    name: newerSettings.name || older.name,
    configured: local.configured || remote.configured,
    xp: Math.max(local.xp, remote.xp),
    streak: latestActive.streak,
    lastActive: latestActive.lastActive,
    bestPron: Math.max(local.bestPron, remote.bestPron),
    grammarWins: Math.max(local.grammarWins, remote.grammarWins),
    rapidBest: Math.max(local.rapidBest, remote.rapidBest),
    progress,
    dailyXp: mergeMax(local.dailyXp, remote.dailyXp),
    reviewsDone: Math.max(local.reviewsDone, remote.reviewsDone),
    chatTurns: Math.max(local.chatTurns, remote.chatTurns),
    achievements: [...new Set([...local.achievements, ...remote.achievements])],
  };
}

function mergeMax(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = { ...b };
  for (const [key, value] of Object.entries(a)) out[key] = Math.max(value, out[key] ?? 0);
  return out;
}

function pickCard(a: Card, b: Card | undefined): Card {
  if (!b) return a;
  const winner = a.box !== b.box ? (a.box > b.box ? a : b) : a.due >= b.due ? a : b;
  return { ...winner, lapses: Math.max(a.lapses, b.lapses) };
}

export type SyncStatus = "off" | "syncing" | "synced" | "error";
export type CloudSync = {
  configured: boolean;
  account: Account | null;
  status: SyncStatus;
  error: string;
  signIn: (provider: AuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
};

/** Keeps the signed-in account's cloud copy in step with this device. */
export function useCloudSync(lingo: Lingo): CloudSync {
  const [account, setAccount] = useState<Account | null>(null);
  const [status, setStatus] = useState<SyncStatus>("off");
  const [error, setError] = useState("");
  const stateRef = useRef(lingo.s);
  stateRef.current = lingo.s;
  const readyFor = useRef<string | null>(null); // user id whose initial merge finished
  const { replace, loaded } = lingo;

  useEffect(() => {
    if (!loaded) return;
    return watchAccount(async (next) => {
      setAccount(next);
      if (!next) { readyFor.current = null; setStatus("off"); return; }
      if (readyFor.current === next.id) return;
      setStatus("syncing"); setError("");
      try {
        const remote = await loadCloudState(next.id);
        let merged = remote ? mergeStates(stateRef.current, sanitize(remote.state)) : stateRef.current;
        if (!merged.name && next.name) merged = { ...merged, name: next.name, settingsAt: Date.now() };
        replace(merged);
        await saveCloudState(next.id, merged);
        readyFor.current = next.id;
        setStatus("synced");
        logDiagnostic("sync", "initial_sync_ok", "info", { hadCloudCopy: Boolean(remote), provider: next.provider });
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        setStatus("error"); setError(message);
        logDiagnostic("sync", "initial_sync_failed", "error", { error: message.slice(0, 200) });
      }
    });
  }, [loaded, replace]);

  // After the first merge, upload changes a couple of seconds after they happen.
  useEffect(() => {
    if (!account || readyFor.current !== account.id) return;
    const timer = window.setTimeout(() => {
      setStatus("syncing");
      saveCloudState(account.id, stateRef.current)
        .then(() => { setStatus("synced"); setError(""); })
        .catch((cause) => { setStatus("error"); setError(cause instanceof Error ? cause.message : String(cause)); });
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [lingo.s, account]);

  return {
    configured: authConfigured,
    account,
    status,
    error,
    signIn: useCallback(async (provider: AuthProvider) => {
      try { await signIn(provider); }
      catch (cause) { setStatus("error"); setError(cause instanceof Error ? cause.message : String(cause)); }
    }, []),
    signOut: useCallback(async () => { await signOut(); readyFor.current = null; setAccount(null); setStatus("off"); }, []),
  };
}
