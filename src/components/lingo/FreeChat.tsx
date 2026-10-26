import { useEffect, useRef, useState } from "react";
import { Send, PhoneOff, Clock, Headphones, Mic, Shuffle } from "lucide-react";
import { PERSONAS, TARGETS } from "@/lib/lingo/content";
import { chatStream, localChat, splitReply } from "@/lib/lingo/chat.functions";
import { createSentenceSpeaker } from "@/lib/lingo/sentenceSpeaker";
import { NUDGES, TOPICS, randomTopic, topicLabel, type Topic } from "@/lib/lingo/topics";
import { langName, makeT, type K } from "@/lib/lingo/i18n";
import { speak, stopSpeaking, unlockAudio, getAccent } from "@/lib/voice";
import type { Lingo } from "@/lib/lingo/store";
import { Btn, Card, MicButton, useSpeech } from "./ui";
import { cn } from "@/lib/utils";
import { useHandsFreeConversation } from "@/lib/lingo/useHandsFreeConversation";

type Msg = { role: "user" | "assistant"; content: string; correction?: string };

function parse(raw: string): { reply: string; correction: string } {
  const m = raw.match(/\{[\s\S]*\}/);
  try {
    const j = JSON.parse(m ? m[0] : raw) as { reply?: unknown; correction?: unknown };
    return { reply: String(j.reply ?? "").trim() || raw.trim(), correction: String(j.correction ?? "").trim() };
  } catch {
    return { reply: raw.replace(/```(json)?/g, "").trim(), correction: "" };
  }
}
/** The last Free Talk conversation per target language, saved on this device so it can be resumed. */
type SavedChat = { msgs: Msg[]; topicId: string; elapsed: number; savedAt: number };
const chatKey = (target: string) => `lingoarena-chat-${target}`;
function loadChat(target: string): SavedChat | null {
  try {
    const saved = JSON.parse(localStorage.getItem(chatKey(target)) || "null") as SavedChat | null;
    // Keep two weeks; older conversations are not worth resuming.
    return saved && Array.isArray(saved.msgs) && saved.msgs.length && Date.now() - saved.savedAt < 14 * 86_400_000 ? saved : null;
  } catch { return null; }
}
function saveChat(target: string, chat: SavedChat) {
  try { localStorage.setItem(chatKey(target), JSON.stringify({ ...chat, msgs: chat.msgs.slice(-60) })); } catch { /* storage full or blocked */ }
}
/** Instructions to the tutor sent as user turns, e.g. "(Let's switch topic…)"; never shown in the transcript. */
const isHiddenTurn = (m: Msg) => m.role === "user" && /^\(.*\)$/s.test(m.content.trim());

const mmss = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
const DURATIONS = [0, 3, 5, 10]; // 0 = unlimited; timed sessions are optional

export function FreeChat({ lingo, reward }: { lingo: Lingo; reward: (xp: number) => void }) {
  const { s } = lingo;
  const t = makeT(s.native);
  const tg = TARGETS.find((x) => x.id === s.target)!;
  const persona = PERSONAS.find((p) => p.id === s.persona)!;
  const [phase, setPhase] = useState<"setup" | "chat" | "summary">("setup");
  const [minutes, setMinutes] = useState(0);
  const [handsFree, setHandsFree] = useState(true);
  const handsFreeRef = useRef(true);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [talking, setTalking] = useState(false);
  const [mouthLevel, setMouthLevel] = useState(0);
  const [hasAudioAmplitude, setHasAudioAmplitude] = useState(false);
  const [left, setLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [offline, setOffline] = useState(false);
  const [offlineReason, setOfflineReason] = useState("");
  const [topic, setTopic] = useState<Topic>(() => randomTopic());
  const topicRef = useRef(topic);
  topicRef.current = topic;
  const usedTopicsRef = useRef<string[]>([]);
  const speakerRef = useRef<ReturnType<typeof createSentenceSpeaker> | null>(null);
  const [savedChat, setSavedChat] = useState<SavedChat | null>(() => loadChat(s.target));
  useEffect(() => { setSavedChat(loadChat(s.target)); }, [s.target]);
  // Autosave the conversation on this device while chatting.
  useEffect(() => {
    if (phase === "chat" && msgs.some((m) => !isHiddenTurn(m))) saveChat(s.target, { msgs, topicId: topic.id, elapsed, savedAt: Date.now() });
  }, [msgs, phase]); // eslint-disable-line react-hooks/exhaustive-deps
  const speech = useSpeech(tg.locale, s.native);
  const msgsRef = useRef<Msg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);
  msgsRef.current = msgs; phaseRef.current = phase; handsFreeRef.current = handsFree;

  useEffect(() => () => { speakerRef.current?.cancel(); stopSpeaking(); }, []);
  useEffect(() => {
    const updateMouth = (event: Event) => {
      const level = Number((event as CustomEvent<{ level?: number }>).detail?.level || 0);
      setMouthLevel(level);
      if (level > 0.025) setHasAudioAmplitude(true);
      else window.setTimeout(() => setHasAudioAmplitude(false), 250);
    };
    window.addEventListener("lingo-audio-level", updateMouth);
    return () => window.removeEventListener("lingo-audio-level", updateMouth);
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  // countdown / elapsed timer
  useEffect(() => {
    if (phase !== "chat") return;
    const id = setInterval(() => {
      setElapsed((e) => e + 1);
      if (minutes > 0) setLeft((l) => l - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [phase, minutes]);
  useEffect(() => { if (phase === "chat" && minutes > 0 && left <= 0) finish(); }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    if (phaseRef.current !== "chat") return;
    speakerRef.current?.cancel(); stopSpeaking(); speech.stop();
    const turns = msgsRef.current.filter((m) => m.role === "user" && !isHiddenTurn(m)).length;
    if (turns > 0) reward(Math.min(30, turns * 3));
    setPhase("summary");
  };

  const sendRef = useRef<(text: string) => void>(() => undefined);
  const rollingSummaryRef = useRef("");
  const sessionTokensRef = useRef(0);
  // Informational estimate only. A client-side estimate must never force lite mode.
  const handsFreeController = useHandsFreeConversation({
    speech,
    enabled: handsFree,
    active: phase === "chat",
    onTranscript: (text) => sendRef.current(text),
    onInterim: setInput,
    onIdle: () => { if (phaseRef.current === "chat") void askRef.current(msgsRef.current, { nudge: true }); },
  });
  const askRef = useRef<(history: Msg[], extra?: { nudge?: boolean }) => Promise<void>>(async () => undefined);

  const afterReply = () => {
    setTalking(false);
    if (handsFreeRef.current && phaseRef.current === "chat") handsFreeController.resumeListening();
  };

  const ask = async (history: Msg[], extra: { nudge?: boolean } = {}) => {
    setBusy(true);
    if (handsFreeRef.current) handsFreeController.thinking();
    if (history.length > 12) {
      const older = history.slice(0, -12).map((message) => `${message.role === "user" ? "Learner" : "Chloe"}: ${message.content}`).join(" | ");
      rollingSummaryRef.current = older.slice(-1100);
    }
    speakerRef.current?.cancel();
    // The reply is spoken sentence by sentence while it streams in, so Chloe starts talking
    // within about a second instead of after the whole answer has been generated.
    const speaker = createSentenceSpeaker({
      lang: tg.locale, rate: s.rate,
      onStart: () => { setTalking(true); if (handsFreeRef.current) handsFreeController.speaking(); },
      onDone: afterReply,
    });
    speakerRef.current = speaker;
    let shown = false;
    const showReply = (reply: string, correction = "") => {
      if (phaseRef.current !== "chat") return;
      const base = history.map((m, i) => (correction && i === history.length - 1 && m.role === "user" ? { ...m, correction } : m));
      setMsgs([...base, { role: "assistant", content: reply }]);
      if (!shown) { shown = true; setBusy(false); }
    };
    const estimatedInputTokens = Math.ceil(history.reduce((sum, message) => sum + message.content.length, 0) / 4);
    const r = await chatStream({
      messages: history.slice(-12).map(({ role, content }) => ({ role, content })),
      targetName: langName(s.target, "en"),
      nativeName: langName(s.native, "en"),
      persona: persona.id,
      cefr: `A${Math.min(2, Math.max(1, Math.ceil((lingo.s.xp + 1) / 300)))}`,
      accent: getAccent(s.target),
      rollingSummary: rollingSummaryRef.current,
      sessionTokensUsed: sessionTokensRef.current,
      topic: topicRef.current.en,
      previousTopics: usedTopicsRef.current,
      nudge: extra.nudge,
      learnerName: s.name,
    }, (textSoFar) => {
      if (phaseRef.current !== "chat" || speakerRef.current !== speaker) return;
      const { reply } = splitReply(textSoFar);
      if (reply) { showReply(reply); speaker.update(reply); }
    });
    if (phaseRef.current !== "chat" || speakerRef.current !== speaker) return;
    if (r.ok) {
      const { reply, correction } = splitReply(r.text);
      sessionTokensRef.current += estimatedInputTokens + Math.ceil(r.text.length / 4);
      setOffline(false); setOfflineReason("");
      showReply(reply, correction);
      speaker.update(reply, true);
      return;
    }
    // AI unavailable: keep the conversation going with the on-device phrasebook.
    console.warn("[LingoArena chat] using local phrasebook fallback:", r.error);
    setOffline(true); setOfflineReason(r.error);
    const local = localChat({ messages: history.filter((m) => !isHiddenTurn(m)), targetName: langName(s.target, "en"), nativeName: langName(s.native, "en"), persona: persona.id, target: s.target });
    const nudges = NUDGES[s.target] || NUDGES.en!;
    const reply = extra.nudge ? `${nudges[Math.floor(Math.random() * nudges.length)]} ${local.reply}` : local.reply;
    showReply(reply, local.correction);
    speaker.update(reply, true);
  };
  askRef.current = ask;

  const changeTopic = (next?: Topic) => {
    const chosen = next ?? randomTopic([topicRef.current.id, ...usedTopicsRef.current]);
    usedTopicsRef.current = [...usedTopicsRef.current, topicRef.current.id].slice(-8);
    setTopic(chosen); topicRef.current = chosen;
    if (phaseRef.current === "chat") {
      speakerRef.current?.cancel(); stopSpeaking(); setTalking(false);
      const history: Msg[] = [...msgsRef.current, { role: "user", content: `(Let's switch topic to: ${chosen.en}.)` }];
      void ask(history);
    }
  };

  const begin = () => {
    void unlockAudio();
    try { localStorage.removeItem(chatKey(s.target)); } catch { /* storage blocked */ }
    setSavedChat(null);
    setMsgs([]); rollingSummaryRef.current = ""; sessionTokensRef.current = 0; setElapsed(0); setLeft(minutes * 60); setOffline(false); setOfflineReason(""); setPhase("chat");
    phaseRef.current = "chat";
    usedTopicsRef.current = [];
    void ask([]); // the avatar opens the conversation on the chosen topic
  };
  const resume = (saved: SavedChat) => {
    void unlockAudio();
    const savedTopic = TOPICS.find((x) => x.id === saved.topicId) ?? topic;
    setTopic(savedTopic); topicRef.current = savedTopic;
    rollingSummaryRef.current = ""; sessionTokensRef.current = 0; setElapsed(saved.elapsed || 0); setLeft(minutes * 60); setOffline(false); setOfflineReason("");
    setMsgs(saved.msgs); msgsRef.current = saved.msgs;
    setPhase("chat"); phaseRef.current = "chat";
    usedTopicsRef.current = [];
    void ask([...saved.msgs, { role: "user", content: "(We are resuming our conversation after a break. Welcome me back in one short sentence and continue where we left off.)" }]);
  };
  const send = (text: string) => {
    const v = text.trim();
    if (!v || busy) return;
    const lastAssistant = [...msgsRef.current].reverse().find((message) => message.role === "assistant")?.content || "";
    const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "").trim();
    const normalizedInput = normalize(v), normalizedAssistant = normalize(lastAssistant);
    if (normalizedInput.length > 12 && normalizedAssistant.length > 12 && (normalizedInput === normalizedAssistant || normalizedAssistant.includes(normalizedInput) || normalizedInput.includes(normalizedAssistant))) {
      console.info("[LingoArena hands-free] ignored likely echo of Chloe's last response");
      if (handsFreeRef.current) handsFreeController.resumeListening();
      return;
    }
    speakerRef.current?.cancel(); stopSpeaking(); setTalking(false);
    if (handsFreeRef.current) handsFreeController.thinking(); else speech.stop();
    const history: Msg[] = [...msgsRef.current, { role: "user", content: v }];
    setMsgs(history); setInput("");
    void ask(history);
  };
  sendRef.current = send;

  if (phase === "setup") return (
    <div className="mx-auto max-w-xl space-y-5">
      <Card className="space-y-5 text-center">
        <div className="relative mx-auto grid h-44 w-full max-w-sm place-items-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 via-violet-800 to-fuchsia-700 text-7xl shadow-xl">
          <div className="absolute inset-x-8 bottom-0 h-24 rounded-t-[50%] bg-white/15 blur-xl" />
          <div className="relative grid h-28 w-28 place-items-center rounded-full border-4 border-white/40 bg-white/15 text-7xl shadow-2xl">👩🏻‍🏫</div>
          <span className="absolute bottom-3 left-4 rounded-full bg-black/25 px-3 py-1 text-sm font-extrabold text-white">Chloe · AI tutor</span>
        </div>
        <h2 className="text-3xl font-extrabold">{t("chatTitle")}</h2>
        <p className="text-muted-foreground">Practica sin límite de tiempo. Activa el modo manos libres para conversar sin pulsar el micrófono en cada turno.</p>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button key={d} onClick={() => setMinutes(d)}
              className={cn("rounded-2xl border-2 p-3 font-extrabold transition", minutes === d ? "border-primary bg-accent text-accent-foreground" : "border-border hover:bg-muted")}>
              {d === 0 ? "∞" : d}<span className="block text-xs font-bold opacity-70">{d === 0 ? t("noLimit") : t("minutes")}</span>
            </button>
          ))}
        </div>
        <div className="space-y-2 text-left">
          <p className="text-xs font-extrabold uppercase text-muted-foreground">{s.native === "es" ? "Tema" : "Topic"}</p>
          <div className="flex gap-2">
            <select value={topic.id} onChange={(e) => setTopic(TOPICS.find((x) => x.id === e.target.value) ?? topic)} className="min-w-0 flex-1 rounded-2xl border-2 border-border bg-background p-3 font-bold">
              {TOPICS.map((x) => <option key={x.id} value={x.id}>{x.emoji} {topicLabel(x, s.native)}</option>)}
            </select>
            <button aria-label={s.native === "es" ? "Tema al azar" : "Random topic"} onClick={() => setTopic(randomTopic([topic.id]))} className="rounded-2xl border-2 border-border px-3 hover:bg-muted"><Shuffle className="h-5 w-5" /></button>
          </div>
        </div>
        <button onClick={() => setHandsFree((v) => !v)} className={cn("flex w-full items-center justify-center gap-2 rounded-2xl border-2 p-3 font-extrabold", handsFree ? "border-primary bg-accent text-accent-foreground" : "border-border") }>
          {handsFree ? <Headphones className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          {handsFree ? "Manos libres activado" : "Activar manos libres"}
        </button>
        {savedChat && <Btn variant="secondary" className="w-full" onClick={() => resume(savedChat)}>
          {s.native === "es" ? "Continuar última conversación" : "Continue last conversation"} · {(TOPICS.find((x) => x.id === savedChat.topicId) ?? topic).emoji} {savedChat.msgs.filter((m) => !isHiddenTurn(m)).length} {s.native === "es" ? "mensajes" : "messages"}
        </Btn>}
        <Btn className="w-full" onClick={begin}>{savedChat ? (s.native === "es" ? "Nueva conversación" : "New conversation") : t("startChat")}</Btn>
      </Card>
    </div>
  );

  if (phase === "summary") {
    const turns = msgs.filter((m) => m.role === "user" && !isHiddenTurn(m)).length;
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <Card className="space-y-4 text-center">
          <div className="text-6xl">🎉</div>
          <h2 className="text-3xl font-extrabold">{minutes > 0 && left <= 0 ? t("timeUp") : t("chatDone")}</h2>
          <p className="text-lg font-bold">{turns} {t("turns")} · {t("elapsed")}: {mmss(elapsed)}{turns > 0 && ` · +${Math.min(30, turns * 3)} XP`}</p>
          <Btn className="w-full" onClick={() => setPhase("setup")}>{t("chatBack")}</Btn>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 font-extrabold"><Clock className="h-5 w-5" />{mmss(elapsed)}</span>
        <button onClick={() => changeTopic()} title={s.native === "es" ? "Cambiar de tema" : "Change topic"} className="flex min-w-0 items-center gap-1 rounded-full border-2 border-border px-3 py-1 text-xs font-extrabold hover:bg-muted">
          <span className="truncate">{topic.emoji} {topicLabel(topic, s.native)}</span><Shuffle className="h-3.5 w-3.5 shrink-0" />
        </button>
        <Btn variant="ghost" className="px-3 py-2" onClick={finish}><PhoneOff className="mr-1 inline h-4 w-4" />{t("endChat")}</Btn>
      </div>

      {/* Avatar call screen: idle / thinking / listening / speaking */}
      <div className={cn("relative flex min-h-[300px] flex-col items-center justify-center gap-3 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 via-violet-800 to-fuchsia-700 p-6 text-white shadow-xl", talking && "avatar-speaking")}>
        <div className={cn("relative grid h-36 w-36 place-items-center rounded-full border-4 border-white/40 bg-white/15 text-8xl shadow-2xl transition", talking && "scale-[1.03]", busy && "animate-pulse", speech.listening && "ring-4 ring-emerald-300")}><span>👩🏻‍🏫</span><span className={cn("avatar-mouth", talking && !hasAudioAmplitude && "avatar-mouth-fallback")} style={{ height: `${3 + mouthLevel * 13}px`, width: `${10 + mouthLevel * 5}px` }} aria-hidden="true" /></div>
        <p className="text-xl font-extrabold">Chloe</p>
        <div className="flex h-6 items-end gap-1" aria-hidden>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} className={cn("w-1.5 rounded-full bg-emerald-300 transition-all", talking ? "animate-pulse" : "")} style={{ height: talking ? 7 + ((i * 9) % 18) : 4, animationDelay: `${i * 90}ms` }} />)}
        </div>
        <p className="text-xs font-bold text-white/80">{speech.processing ? "Transcribing your speech…" : busy || handsFreeController.state === "thinking" ? "Thinking…" : handsFreeController.state === "capturing" ? "Listening to your answer…" : speech.listening || handsFreeController.state === "listening" ? "Listening…" : talking || handsFreeController.state === "speaking" ? "Speaking…" : "Ready to talk"}</p>
        <div className="absolute right-4 top-4 rounded-full bg-black/25 px-3 py-1 text-xs font-bold">{minutes === 0 ? "∞ session" : mmss(Math.max(0, left))}</div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="hidden">{persona.emoji}</div>
        <div className="flex h-5 items-end gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => <span key={i} className={cn("w-1.5 rounded bg-primary transition-all", talking ? "animate-pulse" : "")} style={{ height: talking ? 8 + ((i * 7) % 12) : 4, animationDelay: `${i * 120}ms` }} />)}
        </div>
        <p className="text-xs font-bold text-muted-foreground">{t(`p_${persona.id}` as K)}{busy && ` · ${t("thinking")}`}{speech.processing ? " · Transcribing…" : speech.listening && ` · ${t("listening")}`}</p>
      </div>

      {offline && <p role="status" className="text-center text-xs font-bold text-muted-foreground">{s.native === "es" ? `Modo local: ${offlineReason || "el proveedor de IA no está disponible"}. Puedes seguir practicando con respuestas locales.` : `Local mode: ${offlineReason || "the AI provider is unavailable"}. You can keep practicing with local responses.`}</p>}

      <div className="max-h-[40vh] min-h-[160px] space-y-3 overflow-y-auto rounded-3xl border-2 border-border bg-card p-4">
        {msgs.filter((m) => !isHiddenTurn(m)).map((m, i) => (
          <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
            <div className={cn("max-w-[85%] rounded-2xl px-4 py-2 font-bold", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>{m.content}</div>
            {m.correction && <p className="mt-1 max-w-[85%] text-xs font-bold text-flame">✏️ {m.correction}</p>}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {speech.error && <p className="text-sm font-bold text-destructive">{speech.error}</p>}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground">
        <span>{handsFree ? `Hands-free enabled · ${handsFreeController.state}` : "Manual microphone mode"}</span>
        <button className="rounded-lg border border-border px-2 py-1 text-foreground" onClick={() => { const next = !handsFree; handsFreeRef.current = next; setHandsFree(next); if (!next) handsFreeController.stop(); else if (!talking && !busy) window.setTimeout(() => handsFreeController.startListening(), 150); }}>{handsFree ? "Turn off" : "Turn on"}</button>
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder={t("typeMsg")}
          className="flex-1 rounded-2xl border-2 border-border bg-card p-3 font-bold outline-none focus:border-primary" />
        {speech.supported && <MicButton disabled={speech.processing} listening={speech.listening || handsFreeController.isListening} onClick={() => (speech.listening || handsFreeController.isListening ? (handsFreeController.stop(), speech.stop()) : speech.listen(send, setInput))} />}
        <Btn aria-label={t("send")} onClick={() => send(input)} disabled={!input.trim() || busy}><Send className="h-4 w-4" /></Btn>
      </div>
    </div>
  );
}
