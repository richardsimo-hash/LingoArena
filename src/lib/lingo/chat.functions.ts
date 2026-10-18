import { createServerFn } from "@tanstack/react-start";

type ChatMsg = { role: "user" | "assistant"; content: string };
type ChatInput = { messages: ChatMsg[]; targetName: string; nativeName: string; persona: string };

const PERSONA_STYLE: Record<string, string> = {
  barista: "a witty, mildly sarcastic but warm barista who loves chatting with customers",
  gatekeeper: "a strict but fair gatekeeper who enjoys polite, well-formed conversation",
  guide: "an energetic, enthusiastic tour guide who loves travel and local stories",
};

/**
 * Open conversation engine. Needs LOVABLE_API_KEY (provided when Lovable Cloud / Lovable AI is enabled).
 * The key stays on the server; the browser only ever calls this function.
 */
export const chatReply = createServerFn({ method: "POST" })
  .inputValidator((d: ChatInput) => d)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false as const, error: "no_key" };

    const history = data.messages.slice(-12).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content).slice(0, 1000),
    }));
    if (history.length === 0) {
      history.push({ role: "user", content: "(Start the conversation: greet me briefly and ask me one simple question.)" });
    }

    const system = [
      `You are ${PERSONA_STYLE[data.persona] ?? PERSONA_STYLE.guide}, chatting with a language learner.`,
      `The learner is practicing ${data.targetName}. Their native language is ${data.nativeName}.`,
      `Talk about ANY topic the learner brings up and keep the conversation flowing naturally.`,
      `Always reply in ${data.targetName}, in 1-3 short sentences at an easy, natural level, and usually end with a follow-up question.`,
      `If the learner made a clear mistake, give a very short correction in ${data.nativeName}; otherwise leave it empty.`,
      `If the learner writes in ${data.nativeName}, gently answer in ${data.targetName} and encourage them to try it in ${data.targetName}.`,
      `Respond ONLY with JSON, no markdown: {"reply": "<your ${data.targetName} reply>", "correction": "<short note in ${data.nativeName} or empty string>"}`,
    ].join(" ");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: system }, ...history],
        }),
      });
      if (!res.ok) return { ok: false as const, error: `http_${res.status}` };
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = json.choices?.[0]?.message?.content ?? "";
      return text ? { ok: true as const, text } : { ok: false as const, error: "empty" };
    } catch {
      return { ok: false as const, error: "network" };
    }
  });
