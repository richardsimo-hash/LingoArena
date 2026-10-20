import type { PersonaId, TargetLang } from "./content";

import { setAudioApiStatus } from "./audio";

type ChatMsg = { role: "user" | "assistant"; content: string };
export type ChatInput = { messages: ChatMsg[]; targetName: string; nativeName: string; persona: string; cefr?: string; accent?: string; rollingSummary?: string; sessionTokensUsed?: number };

type Reply = { ok: true; text: string } | { ok: false; error: string };

export async function chatReply(data: ChatInput): Promise<Reply> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, sessionTokensUsed: data.sessionTokensUsed ?? 0 }),
    });
    setAudioApiStatus(String(res.status));
    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string; status?: unknown };
      const status = typeof json.status === "string" ? json.status : `http_${res.status}`;
      return { ok: false, error: json.error ? `${json.error}:${status}` : status };
    }
    const json = (await res.json()) as { text?: string; provider?: string };
    setAudioApiStatus(`chat:${json.provider || "unknown"}`);
    return json.text ? { ok: true, text: json.text, provider: json.provider } as Reply : { ok: false, error: "empty" };
  } catch {
    return { ok: false, error: "network" };
  }
}

/** On-device open conversation when the AI backend is not configured. */
export function localChat(data: ChatInput & { target: TargetLang; persona: PersonaId }): { reply: string; correction: string } {
  const last = [...data.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const n = last.toLowerCase();
  const bank = REPLIES[data.target];
  const persona = PERSONA[data.persona][data.target];
  const topic = topicOf(n);
  const lines = bank[topic];
  const storageKey = `lingoarena-local-last-${data.target}`;
  let previous = "";
  try { previous = localStorage.getItem(storageKey) || ""; } catch { /* storage unavailable */ }
  let idx = Math.abs(hash(last + String(data.messages.length))) % lines.length;
  if (lines.length > 1 && lines[idx] === previous) idx = (idx + 1) % lines.length;
  const responseLine = lines[idx] || bank.open[0];
  try { localStorage.setItem(storageKey, responseLine); } catch { /* storage unavailable */ }
  const keyword = (last.match(/[\p{L}]{4,}/gu) || []).filter((word) => !/^(that|this|with|have|from|your|what|when|where|como|para|pero|porque|este|esta|tengo|quiero|estoy)$/i.test(word)).at(-1);
  const follow = keyword ? followAbout(data.target, keyword) : bank.follow[Math.abs(hash(last + "f")) % bank.follow.length];
  return { reply: `${persona} ${responseLine} ${follow}`.replace(/\s+/g, " ").trim(), correction: "" };
}
function followAbout(language: TargetLang, keyword: string): string {
  const safe = keyword.slice(0, 40);
  const templates: Record<TargetLang, string> = {
    en: `What do you enjoy most about ${safe}?`, es: `¿Qué es lo que más te gusta de ${safe}?`,
    fr: `Qu'est-ce que tu apprécies le plus dans ${safe} ?`, de: `Was gefällt dir an ${safe} am besten?`,
    it: `Che cosa ti piace di più di ${safe}?`, pt: `O que mais gostas em ${safe}?`, ja: `${safe}のどんなところが一番好きですか？`,
  };
  return templates[language];
}

function topicOf(n: string) {
  if (!n.trim()) return "hello";
  if (/hola|hello|hi |hey|bonjour|ciao|hallo|olá|こん/.test(n)) return "hello";
  if (/food|comida|manger|essen|cibo|comer|café|coffee|pizza|sushi/.test(n)) return "food";
  if (/travel|viaje|voyage|reise|viaggio|viagem|hotel|train|avion|flight/.test(n)) return "travel";
  if (/music|música|musique|musik|musica|song|película|movie|film|book|libro/.test(n)) return "culture";
  if (/work|trabajo|travail|arbeit|lavoro|trabalho|school|escuela|estudio/.test(n)) return "work";
  if (/family|familia|famille|familie|famiglia|família|friend|amigo/.test(n)) return "people";
  if (/sport|fútbol|football|soccer|run|gym|yoga/.test(n)) return "sport";
  if (/weather|tiempo|clima|météo|wetter|tempo/.test(n)) return "weather";
  return "open";
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

const PERSONA: Record<PersonaId, Record<TargetLang, string>> = {
  barista: {
    es: "Entiendo lo que quieres decir.",
    en: "I see what you mean.",
    fr: "Je vois ce que tu veux dire.",
    de: "Ich verstehe, was du meinst.",
    it: "Capisco cosa intendi.",
    pt: "Entendo o que queres dizer.",
    ja: "なるほど。",
  },
  gatekeeper: {
    es: "De acuerdo.",
    en: "Very well.",
    fr: "Très bien.",
    de: "Sehr gut.",
    it: "Molto bene.",
    pt: "Muito bem.",
    ja: "わかりました。",
  },
  guide: {
    es: "¡Me encanta eso!",
    en: "I love that!",
    fr: "J'adore ça !",
    de: "Das liebe ich!",
    it: "Adoro!",
    pt: "Adoro isso!",
    ja: "いいですね！",
  },
};

type Bank = Record<"hello" | "food" | "travel" | "culture" | "work" | "people" | "sport" | "weather" | "open" | "follow", string[]>;

const REPLIES: Record<TargetLang, Bank> = {
  es: {
    hello: ["¿Cómo estás hoy?", "¿Qué tal tu día?", "Encantado de hablar contigo."],
    food: ["A mí me gusta la comida simple y buena.", "¿Prefieres dulce o salado?", "El café de la mañana es sagrado para mí."],
    travel: ["Viajar abre la cabeza.", "¿Ciudad o playa?", "Me encantan los trenes lentos y las ventanas grandes."],
    culture: ["El arte y la música cuentan historias.", "¿Qué escuchas últimamente?", "Una buena película puede cambiar el ánimo."],
    work: ["El trabajo va mejor con pausas cortas.", "¿Estás más de oficina o de proyectos libres?", "Aprender un idioma también es un trabajo valiente."],
    people: ["La gente cercana nos enseña mucho.", "¿Con quién te gusta pasar el fin de semana?", "Un buen amigo hace el día más fácil."],
    sport: ["Moverse un poco ayuda a pensar mejor.", "¿Eres más de equipo o de entrenar solo?", "Caminar cuenta, no hace falta ser atleta."],
    weather: ["Hoy el cielo decide el plan.", "¿Te gusta más el calor o el frío?", "La lluvia es perfecta para una conversación."],
    open: ["Cuéntame más, de verdad me interesa.", "No hay tema prohibido aquí.", "Sigue, te escucho."],
    follow: ["¿Y tú qué opinas?", "¿Por qué te gusta eso?", "¿Qué más te gustaría practicar hoy?"],
  },
  en: {
    hello: ["How are you today?", "How’s your day going?", "Great to talk with you."],
    food: ["I like simple, good food.", "Sweet or savory?", "Morning coffee is a ritual for me."],
    travel: ["Travel really opens your mind.", "City or beach?", "I love slow trains and big windows."],
    culture: ["Art and music tell stories.", "What are you listening to lately?", "A good film can change the mood."],
    work: ["Work goes better with short breaks.", "Office life or free projects?", "Learning a language is brave work too."],
    people: ["The people close to us teach us a lot.", "Who do you like spending weekends with?", "A good friend makes the day easier."],
    sport: ["Moving a little helps you think.", "Team sports or training alone?", "Walking counts — you don’t need to be an athlete."],
    weather: ["The sky decides the plan today.", "Do you prefer heat or cold?", "Rain is perfect for a conversation."],
    open: ["Tell me more — I’m interested.", "No topic is off limits here.", "Go on, I’m listening."],
    follow: ["What do you think?", "Why do you like that?", "What else would you like to practice today?"],
  },
  fr: {
    hello: ["Comment vas-tu aujourd'hui ?", "Ta journée se passe bien ?", "Ravi de parler avec toi."],
    food: ["J'aime la cuisine simple et bonne.", "Sucré ou salé ?", "Le café du matin est sacré."],
    travel: ["Voyager ouvre l'esprit.", "Ville ou plage ?", "J'adore les trains lents et les grandes fenêtres."],
    culture: ["L'art et la musique racontent des histoires.", "Tu écoutes quoi en ce moment ?", "Un bon film peut changer l'humeur."],
    work: ["Le travail va mieux avec de courtes pauses.", "Bureau ou projets libres ?", "Apprendre une langue, c'est aussi un travail courageux."],
    people: ["Les proches nous apprennent beaucoup.", "Avec qui aimes-tu passer le week-end ?", "Un bon ami rend la journée plus légère."],
    sport: ["Bouger un peu aide à penser.", "Équipe ou entraînement solo ?", "Marcher compte, pas besoin d'être athlète."],
    weather: ["Le ciel décide le programme aujourd'hui.", "Tu préfères le chaud ou le froid ?", "La pluie est parfaite pour une conversation."],
    open: ["Raconte-moi plus, ça m'intéresse.", "Ici, aucun sujet n'est interdit.", "Continue, je t'écoute."],
    follow: ["Et toi, tu en penses quoi ?", "Pourquoi tu aimes ça ?", "Tu veux pratiquer quoi d'autre aujourd'hui ?"],
  },
  de: {
    hello: ["Wie geht es dir heute?", "Wie läuft dein Tag?", "Schön, mit dir zu sprechen."],
    food: ["Ich mag einfaches, gutes Essen.", "Süß oder herzhaft?", "Der Morgenkaffee ist mir heilig."],
    travel: ["Reisen öffnet den Kopf.", "Stadt oder Strand?", "Ich liebe langsame Züge und große Fenster."],
    culture: ["Kunst und Musik erzählen Geschichten.", "Was hörst du gerade?", "Ein guter Film kann die Stimmung ändern."],
    work: ["Arbeit läuft besser mit kurzen Pausen.", "Büro oder freie Projekte?", "Eine Sprache lernen ist auch mutige Arbeit."],
    people: ["Nahe Menschen lehren uns viel.", "Mit wem verbringst du gern das Wochenende?", "Ein guter Freund macht den Tag leichter."],
    sport: ["Ein bisschen Bewegung hilft beim Denken.", "Mannschaft oder allein trainieren?", "Spazieren zählt — du musst kein Athlet sein."],
    weather: ["Der Himmel entscheidet heute den Plan.", "Magst du eher Wärme oder Kälte?", "Regen ist perfekt für ein Gespräch."],
    open: ["Erzähl mehr, das interessiert mich.", "Hier ist kein Thema verboten.", "Weiter, ich höre zu."],
    follow: ["Was denkst du?", "Warum magst du das?", "Was möchtest du heute noch üben?"],
  },
  it: {
    hello: ["Come stai oggi?", "Come va la giornata?", "Felice di parlarti."],
    food: ["Mi piace il cibo semplice e buono.", "Dolce o salato?", "Il caffè del mattino è sacro."],
    travel: ["Viaggiare apre la mente.", "Città o mare?", "Amo i treni lenti e i finestrini grandi."],
    culture: ["Arte e musica raccontano storie.", "Cosa ascolti in questo periodo?", "Un bel film può cambiare l'umore."],
    work: ["Il lavoro va meglio con pause brevi.", "Ufficio o progetti liberi?", "Imparare una lingua è un lavoro coraggioso."],
    people: ["Le persone vicine ci insegnano molto.", "Con chi ti piace passare il weekend?", "Un buon amico rende il giorno più facile."],
    sport: ["Muoverti un po' aiuta a pensare.", "Squadra o allenamento da solo?", "Camminare conta, non serve essere atleti."],
    weather: ["Oggi il cielo decide il piano.", "Preferisci il caldo o il freddo?", "La pioggia è perfetta per una conversazione."],
    open: ["Dimmi di più, mi interessa.", "Qui nessun argomento è vietato.", "Continua, ti ascolto."],
    follow: ["Tu che ne pensi?", "Perché ti piace?", "Cos'altro vuoi praticare oggi?"],
  },
  pt: {
    hello: ["Como estás hoje?", "Como está o teu dia?", "É bom falar contigo."],
    food: ["Gosto de comida simples e boa.", "Doce ou salgado?", "O café da manhã é sagrado."],
    travel: ["Viajar abre a cabeça.", "Cidade ou praia?", "Adoro comboios lentos e janelas grandes."],
    culture: ["A arte e a música contam histórias.", "O que andas a ouvir?", "Um bom filme muda o humor."],
    work: ["O trabalho corre melhor com pausas curtas.", "Escritório ou projetos livres?", "Aprender uma língua também é um trabalho corajoso."],
    people: ["As pessoas próximas ensinam-nos muito.", "Com quem gostas de passar o fim de semana?", "Um bom amigo torna o dia mais fácil."],
    sport: ["Mover um pouco ajuda a pensar.", "Equipa ou treino sozinho?", "Caminhar conta — não precisas de ser atleta."],
    weather: ["Hoje o céu decide o plano.", "Preferes calor ou frio?", "A chuva é perfeita para uma conversa."],
    open: ["Conta-me mais, interessa-me.", "Aqui não há tema proibido.", "Continua, estou a ouvir."],
    follow: ["E tu, o que achas?", "Porque é que gostas disso?", "O que mais queres praticar hoje?"],
  },
  ja: {
    hello: ["今日の調子はどうですか？", "一日は順調ですか？", "話せてうれしいです。"],
    food: ["シンプルでおいしい食べ物が好きです。", "甘いものと塩辛いもの、どちらが好きですか？", "朝のコーヒーは大切です。"],
    travel: ["旅行は視野を広げます。", "街と海、どちらがいいですか？", "ゆっくりな電車と大きな窓が好きです。"],
    culture: ["芸術と音楽は物語を語ります。", "最近何を聴いていますか？", "いい映画は気分を変えます。"],
    work: ["短い休憩があると仕事がはかどります。", "オフィスと自由な仕事、どちらが多いですか？", "言語を学ぶことも勇気のいる仕事です。"],
    people: ["身近な人から多くを学びます。", "週末は誰と過ごしますか？", "良い友だちは一日を楽にしてくれます。"],
    sport: ["少し体を動かすと考えやすくなります。", "チームと一人、どちらが好きですか？", "歩くだけでも十分です。"],
    weather: ["今日は空が予定を決めます。", "暑いのと寒いの、どちらが好きですか？", "雨の日は会話にぴったりです。"],
    open: ["もっと教えてください。興味があります。", "ここではどんな話題でも大丈夫です。", "続けてください。聞いています。"],
    follow: ["あなたはどう思いますか？", "なぜそれが好きですか？", "今日はほかに何を練習したいですか？"],
  },
};
