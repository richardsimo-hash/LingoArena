type Body = {
  messages: { role: "user" | "assistant"; content: string }[];
  targetName: string;
  nativeName: string;
  persona: string;
};

const PERSONA_STYLE: Record<string, string> = {
  barista: "a witty, mildly sarcastic but warm barista who loves chatting with customers",
  gatekeeper: "a strict but fair gatekeeper who enjoys polite, well-formed conversation",
  guide: "an energetic, enthusiastic tour guide who loves travel and local stories",
};

export default async function handler(req: { method?: string; body?: Body }, res: { status: (n: number) => { json: (v: unknown) => void } }) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  const key = process.env.LOVABLE_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) return res.status(501).json({ error: "no_key" });

  const data = req.body ?? ({} as Body);
  const history = (data.messages ?? []).slice(-12).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content ?? "").slice(0, 1000),
  }));
  if (history.length === 0) {
    history.push({ role: "user", content: "(Start the conversation: greet me briefly and ask me one simple question.)" });
  }

  const system = [
    `You are ${PERSONA_STYLE[data.persona] ?? PERSONA_STYLE.guide}, chatting with a language learner.`,
    `The learner is practicing ${data.targetName}. Their native language is ${data.nativeName}.`,
    `Talk about ANY topic the learner brings up and keep the conversation flowing naturally. Never end the interaction abruptly.`,
    `Always reply in ${data.targetName}, in 1-3 short, natural sentences calibrated to a beginner-to-intermediate learner, and usually end with a relevant follow-up question. Keep context from previous turns.`,
    `If the learner made a clear mistake, give a very short correction in ${data.nativeName}; otherwise leave it empty.`,
    `If the learner writes in ${data.nativeName}, gently answer in ${data.targetName} and encourage them to try it in ${data.targetName}.`,
    `Respond ONLY with JSON, no markdown: {"reply": "<your ${data.targetName} reply>", "correction": "<short note in ${data.nativeName} or empty string>"}`,
  ].join(" ");

  const url = process.env.LOVABLE_API_KEY
    ? "https://ai.gateway.lovable.dev/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const model = process.env.LOVABLE_API_KEY ? "google/gemini-2.5-flash" : "gpt-4o-mini";

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "system", content: system }, ...history] }),
    });
    if (!r.ok) return res.status(r.status).json({ error: `http_${r.status}` });
    const json = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content ?? "";
    if (!text) return res.status(502).json({ error: "empty" });
    return res.status(200).json({ text });
  } catch {
    return res.status(502).json({ error: "network" });
  }
}
