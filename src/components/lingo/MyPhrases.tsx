import { useMemo, useState } from "react";
import { ArrowLeft, Download, Volume2 } from "lucide-react";
import { CONCEPTS, TARGETS } from "@/lib/lingo/content";
import { dayNumber } from "@/lib/lingo/srs";
import { makeT } from "@/lib/lingo/i18n";
import type { Lingo } from "@/lib/lingo/store";
import { speak } from "@/lib/voice";
import { Btn, Card } from "./ui";
import { cn } from "@/lib/utils";

type Filter = "all" | "due" | "mastered";

/** Every learned phrase with its review box, audio, search, and Anki/CSV export (all on-device). */
export function MyPhrases({ lingo, onBack }: { lingo: Lingo; onBack: () => void }) {
  const { s, deck } = lingo;
  const t = makeT(s.native);
  const tg = TARGETS.find((x) => x.id === s.target)!;
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const today = dayNumber();
  const rows = useMemo(() => {
    const byId = new Map(CONCEPTS.map((c) => [c.id, c]));
    return Object.entries(deck)
      .map(([id, card]) => ({ concept: byId.get(id)!, card }))
      .filter((r) => r.concept)
      .sort((a, b) => a.concept.unit - b.concept.unit || a.concept.id.localeCompare(b.concept.id));
  }, [deck]);
  const q = query.trim().toLocaleLowerCase();
  const shown = rows.filter((r) => (filter === "all" || (filter === "due" ? r.card.due <= today : r.card.box === 5))
    && (!q || r.concept.tr[s.target].toLocaleLowerCase().includes(q) || r.concept.tr[s.native].toLocaleLowerCase().includes(q)));

  const download = (kind: "anki" | "csv") => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const text = kind === "anki"
      ? ["#separator:tab", "#html:false", "#tags column:3", ...rows.map((r) => `${r.concept.tr[s.target]}\t${r.concept.tr[s.native]}\tLingoArena unit${r.concept.unit + 1}`)].join("\n")
      : ["target,native,unit,box", ...rows.map((r) => [esc(r.concept.tr[s.target]), esc(r.concept.tr[s.native]), r.concept.unit + 1, r.card.box].join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: kind === "anki" ? "text/plain" : "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `lingoarena-${s.target}-phrases.${kind === "anki" ? "txt" : "csv"}`; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-2">
        <button aria-label={t("exit")} onClick={onBack} className="rounded-full p-2 hover:bg-muted"><ArrowLeft /></button>
        <h2 className="text-2xl font-extrabold">📒 {t("myPhrases")} · {rows.length}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPhrases")} className="min-w-0 flex-1 rounded-2xl border-2 border-border bg-card p-2.5 font-bold" />
        {(["all", "due", "mastered"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn("rounded-2xl border-2 px-3 text-sm font-extrabold", filter === f ? "border-primary bg-accent" : "border-border")}>{t(f === "all" ? "filterAll" : f === "due" ? "filterDue" : "filterMastered")}</button>
        ))}
      </div>
      {rows.length === 0 ? <Card className="text-center text-muted-foreground">{t("noPhrasesYet")}</Card> : (
        <Card className="divide-y divide-border p-0">
          {shown.map(({ concept, card }) => (
            <div key={concept.id} className="flex items-center gap-3 p-3">
              <button aria-label={t("listenBtn")} onClick={() => speak(concept.tr[s.target], { lang: tg.locale, rate: s.rate })} className="rounded-xl bg-secondary p-2 text-secondary-foreground"><Volume2 className="h-4 w-4" /></button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{concept.tr[s.target]}</p>
                <p className="truncate text-sm text-muted-foreground">{concept.tr[s.native]}</p>
              </div>
              <span className="flex gap-0.5" title={`Box ${card.box}/5`}>{[1, 2, 3, 4, 5].map((b) => <i key={b} className={cn("h-2.5 w-2.5 rounded-full", b <= card.box ? (card.box === 5 ? "bg-flame" : "bg-primary") : "bg-muted")} />)}</span>
            </div>
          ))}
        </Card>
      )}
      {rows.length > 0 && <div className="flex gap-2">
        <Btn variant="secondary" className="flex-1" onClick={() => download("anki")}><Download className="mr-2 inline h-4 w-4" />Anki</Btn>
        <Btn variant="ghost" className="flex-1" onClick={() => download("csv")}><Download className="mr-2 inline h-4 w-4" />CSV</Btn>
      </div>}
    </div>
  );
}
