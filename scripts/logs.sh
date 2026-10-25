#!/usr/bin/env bash
# Prints LingoArena client diagnostics (mic/stt events) and /api/stt logs from Vercel.
# Usage: scripts/logs.sh [since=30m] [extra filter text]
# Hobby plans keep runtime logs for about an hour. Requires `vercel login`.
set -euo pipefail
SINCE="${1:-30m}"
vercel --scope team_LVmKCGKFbfyMP0o0lwtC0V8W logs --project lingoarena --since "$SINCE" --limit 100 ${2:+--query "$2"} 2>/dev/null \
  | grep '"type":"log"' \
  | python3 -c '
import json, sys
rows = []
for line in sys.stdin:
    d = json.loads(line)["data"]
    try: m = json.loads(d["message"])
    except Exception: m = {"raw": d["message"][:200]}
    rows.append((d["timestamp"], d["requestPath"], m))
for ts, path, m in sorted(rows, key=lambda r: r[0]):
    what = m.get("event") or m.get("stage") or m.get("raw")
    extra = m.get("details") or {k: v for k, v in m.items() if k not in ("app", "route", "at", "stage", "requestId")}
    print(ts[11:23], m.get("session", "") or "", m.get("level", ""), path, what, json.dumps(extra)[:400])
'
