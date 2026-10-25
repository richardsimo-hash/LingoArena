/** Column order of every phrase row: en, es, fr, de, it, pt (European), ja. */
export type Row = [string, string, string, string, string, string, string];
/** Unit title in each interface language: en, es, fr, de, it, pt. */
export type Titles = [string, string, string, string, string, string];
export type Cefr = "A1" | "A2" | "B1" | "B2";

/** One unit = 3 lessons x 3 phrases. `focus` names the communicative/grammar goal. */
export type UnitDef = { emoji: string; level: Cefr; focus: string; title: Titles; rows: Row[] };
