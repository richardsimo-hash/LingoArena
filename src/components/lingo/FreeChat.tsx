import { useEffect, useRef, useState } from "react";
import { Send, PhoneOff, Clock, Headphones, Mic, MicOff } from "lucide-react";
import { PERSONAS, TARGETS } from "@/lib/lingo/content";
import { chatReply, localChat } from "@/lib/lingo/chat.functions";
import { langName, makeT, type K } from "@/lib/lingo/i18n";
import { speak, stopSpeaking } from "@/lib/lingo/audio";
import type { Lingo } from "@/lib/lingo/store";
import { Btn, Card, MicButton, useSpeech } from "./ui";
import { cn } from "@/lib/utils";

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
  const [left, setLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [offline, setOffline] = useState(false);
  const speech = useSpeech(tg.locale, s.native);
  const msgsRef = useRef<Msg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);
  msgsRef.current = msgs; phaseRef.current = phase; handsFreeRef.current = handsFree;

  useEffect(() => () => stopSpeaking(), []);
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
    stopSpeaking(); speech.stop();
    const turns = msgsRef.current.filter((m) => m.role === "user").length;
    if (turns > 0) reward(Math.min(30, turns * 3));
    setPhase("summary");
  };

  const sendRef = useRef<(text: string) => void>(() => undefined);

  const ask = async (history: Msg[]) => {
    setBusy(true);
    let reply = "", correction = "";
    try {
      const r = await chatReply({
        messages: history.map(({ role, content }) => ({ role, content })),
        targetName: langName(s.target, "en"),
        nativeName: langName(s.native, "en"),
        persona: persona.id,
      });
      if (!r.ok) throw new Error(r.error);
      ({ reply, correction } = parse(r.text));
      setOffline(false);
    } catch {
      setOffline(true);
      const local = localChat({
        messages: history,
        targetName: langName(s.target, "en"),
        nativeName: langName(s.native, "en"),
        persona: persona.id,
        target: s.target,
      });
      reply = local.reply;
      correction = local.correction;
    }
    if (phaseRef.current !== "chat") return;
    const base = history.map((m, i) => (correction && i === history.length - 1 && m.role === "user" ? { ...m, correction } : m));
    setMsgs([...base, { role: "assistant", content: reply }]);
    setBusy(false);
    speak(reply, tg.locale, s.rate, {
      onStart: () => setTalking(true),
      onEnd: () => {
        setTalking(false);
        // In hands-free mode, open the next listening turn automatically after the avatar finishes.
        if (handsFreeRef.current && phaseRef.current === "chat") {
          window.setTimeout(() => {
            if (handsFreeRef.current && phaseRef.current === "chat") speech.listen((text) => sendRef.current(text), setInput, false);
          }, 250);
        }
      },
    });
  };

  const begin = () => {
    setMsgs([]); setElapsed(0); setLeft(minutes * 60); setOffline(false); setPhase("chat");
    phaseRef.current = "chat";
    void ask([]); // the avatar opens the conversation
  };
  const send = (text: string) => {
    const v = text.trim();
    if (!v || busy) return;
    stopSpeaking(); setTalking(false);
    const history: Msg[] = [...msgsRef.current, { role: "user", content: v }];
    setMsgs(history); setInput("");
    void ask(history);
  };
  sendRef.current = send;

  if (phase === "setup") return (
    <div className="mx-auto max-w-xl space-y-5">
      <Card className="space-y-5 text-center">
        <div className="text-7xl">{persona.emoji}</div>
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
        <button onClick={() => setHandsFree((v) => !v)} className={cn("flex w-full items-center justify-center gap-2 rounded-2xl border-2 p-3 font-extrabold", handsFree ? "border-primary bg-accent text-accent-foreground" : "border-border") }>
          {handsFree ? <Headphones className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          {handsFree ? "Manos libres activado" : "Activar manos libres"}
        </button>
        <Btn className="w-full" onClick={begin}>{t("startChat")}</Btn>
      </Card>
    </div>
  );

  if (phase === "summary") {
    const turns = msgs.filter((m) => m.role === "user").length;
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
        <span className="flex items-center gap-1 font-extrabold"><Clock className="h-5 w-5" />{mmss(elapsed)} · sin límite</span>
        <Btn variant="ghost" className="px-3 py-2" onClick={finish}><PhoneOff className="mr-1 inline h-4 w-4" />{t("endChat")}</Btn>
      </div>

      {/* Avatar: idle / thinking / listening / speaking */}
      <div className="flex flex-col items-center gap-2">
        <div className={cn("grid h-28 w-28 place-items-center rounded-full bg-accent text-6xl transition",
          talking && "animate-bounce", busy && "animate-pulse", speech.listening && "ring-4 ring-heart")}>{persona.emoji}</div>
        <div className="flex h-5 items-end gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => <span key={i} className={cn("w-1.5 rounded bg-primary transition-all", talking ? "animate-pulse" : "")} style={{ height: talking ? 8 + ((i * 7) % 12) : 4, animationDelay: `${i * 120}ms` }} />)}
        </div>
        <p className="text-xs font-bold text-muted-foreground">{t(`p_${persona.id}` as K)}{busy && ` · ${t("thinking")}`}{speech.listening && ` · ${t("listening")}`}</p>
      </div>

      {offline && <p className="text-center text-xs font-bold text-destructive">{t("chatErr")}</p>}

      <div className="max-h-[40vh] min-h-[160px] space-y-3 overflow-y-auto rounded-3xl border-2 border-border bg-card p-4">
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
            <div className={cn("max-w-[85%] rounded-2xl px-4 py-2 font-bold", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>{m.content}</div>
            {m.correction && <p className="mt-1 max-w-[85%] text-xs font-bold text-flame">✏️ {m.correction}</p>}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {speech.error && <p className="text-sm font-bold text-destructive">{speech.error}</p>}
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder={t("typeMsg")}
          className="flex-1 rounded-2xl border-2 border-border bg-card p-3 font-bold outline-none focus:border-primary" />
        {speech.supported && <MicButton listening={speech.listening} onClick={() => (speech.listening ? speech.stop() : speech.listen(send, setInput))} />}
        <Btn variant="ghost" aria-label="Toggle hands-free" onClick={() => setHandsFree((v) => !v)} className="px-3">{handsFree ? <MicOff className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}</Btn>
        <Btn aria-label={t("send")} onClick={() => send(input)} disabled={!input.trim() || busy}><Send className="h-4 w-4" /></Btn>
      </div>
    </div>
  );
}
