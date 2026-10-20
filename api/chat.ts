type ChatMessage = { role: "user" | "assistant"; content: string };
type Body = {
  messages?: ChatMessage[];
  targetName?: string;
  nativeName?: string;
  persona?: string;
  cefr?: string;
  accent?: string;
  rollingSummary?: string;
};
const PERSONA_STYLE: Record<string, string> = {
  barista: "a warm, witty café barista who is curious about people",
  gatekeeper: "a patient, precise language coach who values clear communication",
  guide: "an enthusiastic local tour guide who loves travel and stories",
};
const timeoutSignal = (ms: number) => AbortSignal.timeout(ms);

async function openAIChat(key: string, system: string, messages: ChatMessage[]) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST", signal: timeoutSignal(12000),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini", temperature: 0.7, max_tokens: 220, messages: [{ role: "system", content: system }, ...messages] }),
  });
  if (!response.ok) throw new Error(`openai_chat_http_${response.status}`);
  const data = await response.json() as { choices?: { message?: { content?: string | null } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("openai_chat_empty");
  return text;
}
async function geminiChat(key: string, system: string, messages: ChatMessage[]) {
  const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_CHAT_MODEL || "gemini-2.0-flash")}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST", signal: timeoutSignal(12000), headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { temperature: 0.7, maxOutputTokens: 220 } }),
  });
  if (!response.ok) throw new Error(`gemini_chat_http_${response.status}`);
  const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
  if (!text) throw new Error("gemini_chat_empty");
  return text;
}

export default async function handler(req: { method?: string; body?: Body }, res: { setHeader?: (k: string, v: string) => void; status: (n: number) => { json: (v: unknown) => void } }) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const data = req.body ?? {};
  const target = String(data.targetName || "the target language").slice(0, 80);
  const native = String(data.nativeName || "the learner's native language").slice(0, 80);
  const cefr = String(data.cefr || "B1").slice(0, 8);
  const accent = String(data.accent || "Auto").slice(0, 60);
  const persona = PERSONA_STYLE[String(data.persona || "guide")] || PERSONA_STYLE.guide;
  const history: ChatMessage[] = (Array.isArray(data.messages) ? data.messages : []).slice(-12).map((m) => ({
    role: m?.role === "assistant" ? "assistant" : "user",
    content: String(m?.content || "").slice(0, 1200),
  }));
  if (!history.length) history.push({ role: "user", content: "Start the conversation: greet me warmly and ask one natural question." });
  const summary = String(data.rollingSummary || "").slice(0, 1200);
  const system = [
    `You are Chloe, a warm, patient, curious language tutor on a live voice call. Your conversation persona is ${persona}.`,
    `Learner: native language ${native}, learning ${target}, CEFR level ${cefr}, preferred accent ${accent}.`,
    `Speak mostly in ${target}, adapted to ${cefr}. Use ${native} only for a one-line clarification when the learner is stuck.`,
    `Reply in 2-4 short spoken sentences. No markdown, no emojis, no lists. Understand the learner's intent, answer with substance, give one reason or example, then ask ONE natural follow-up question.`,
    `If the learner makes a mistake, recast it correctly inside your reply. Every few turns add a brief useful tip. Remember context and refer back to details the learner shared. Never be generic.`,
    `If the learner uses ${native}, gently model a response in ${target} and encourage them without shaming.`,
    `Return ONLY valid JSON: {"reply":"spoken response in ${target}","correction":"brief optional correction in ${native} or empty string"}.`,
    summary ? `Rolling conversation summary: ${summary}` : "",
  ].filter(Boolean).join(" ");

  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (openaiKey) {
    try { const text = await openAIChat(openaiKey, system, history); return res.status(200).json({ text, provider: "openai" }); }
    catch (error) { console.warn("[LingoArena API] OpenAI chat failed; trying Gemini", error); }
  } else console.info("[LingoArena API] OPENAI_API_KEY missing; trying Gemini");
  if (geminiKey) {
    try { const text = await geminiChat(geminiKey, system, history); return res.status(200).json({ text, provider: "gemini" }); }
    catch (error) { console.warn("[LingoArena API] Gemini chat failed; client phrasebook fallback will be used", error); }
  } else console.info("[LingoArena API] GEMINI_API_KEY missing; client phrasebook fallback will be used");
  return res.status(503).json({ error: "providers_unavailable", fallback: "local_phrasebook" });
}
