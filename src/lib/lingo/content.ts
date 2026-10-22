export type TargetLang = "es" | "fr" | "en" | "de" | "it" | "ja" | "pt";
export type NativeLang = "en" | "es" | "fr" | "de" | "it" | "pt";
export type PersonaId = "barista" | "gatekeeper" | "guide";

export const TARGETS: { id: TargetLang; name: string; flag: string; locale: string }[] = [
  { id: "es", name: "Spanish", flag: "🇪🇸", locale: "es-ES" },
  { id: "fr", name: "French", flag: "🇫🇷", locale: "fr-FR" },
  { id: "en", name: "English", flag: "🇺🇸", locale: "en-US" },
  { id: "de", name: "German", flag: "🇩🇪", locale: "de-DE" },
  { id: "it", name: "Italian", flag: "🇮🇹", locale: "it-IT" },
  { id: "ja", name: "Japanese", flag: "🇯🇵", locale: "ja-JP" },
  { id: "pt", name: "Portuguese", flag: "🇵🇹", locale: "pt-PT" },
];
export const NATIVES: { id: NativeLang; name: string }[] = [
  { id: "en", name: "English" }, { id: "es", name: "Spanish" }, { id: "fr", name: "French" },
  { id: "de", name: "German" }, { id: "it", name: "Italian" }, { id: "pt", name: "Portuguese" },
];

export const PERSONAS: { id: PersonaId; name: string; emoji: string; blurb: string; lines: string[] }[] = [
  { id: "barista", name: "The Sarcastic Barista", emoji: "☕", blurb: "Demands precision when you order.", lines: [] },
  { id: "gatekeeper", name: "The Strict Gatekeeper", emoji: "🛡️", blurb: "No passage until grammar is perfect.", lines: [] },
  { id: "guide", name: "The Energetic Tour Guide", emoji: "🗺️", blurb: "Rapid-fire travel & directions.", lines: [] },
];

/** Unit titles are translated in i18n.ts (unitTitle). `title` is the English fallback. */
export type CEFR = "A1" | "A2" | "B1" | "B2" | "C1";
export type CurriculumUnit = { id: number; title: string; emoji: string; theme: string; grammar: string; vocabularyBand: string; cefr: CEFR };
const UNIT_SEEDS: Omit<CurriculumUnit, "id" | "cefr">[] = [
  { title: "Greetings & Politeness", emoji: "👋", theme: "social introductions", grammar: "be; subject pronouns; basic questions", vocabularyBand: "high-frequency greetings" },
  { title: "Cafés & Food", emoji: "🥐", theme: "food and ordering", grammar: "countable nouns; would like; articles", vocabularyBand: "food and quantities" },
  { title: "Directions & Transport", emoji: "🧭", theme: "navigation", grammar: "imperatives; prepositions of place", vocabularyBand: "places and transport" },
  { title: "Shopping & Hotels", emoji: "🛍️", theme: "travel services", grammar: "prices; polite requests; comparatives", vocabularyBand: "shopping and accommodation" },
  { title: "Health & Emergencies", emoji: "🚑", theme: "health and safety", grammar: "have got; should; urgent requests", vocabularyBand: "body and assistance" },
  { title: "Daily Routines", emoji: "⏰", theme: "everyday habits", grammar: "present simple; frequency adverbs", vocabularyBand: "routine verbs" },
  { title: "Family & Relationships", emoji: "👨‍👩‍👧", theme: "family", grammar: "possessives; have/has; descriptions", vocabularyBand: "family and personality" },
  { title: "Home & Neighbourhood", emoji: "🏡", theme: "home", grammar: "there is/are; prepositions", vocabularyBand: "rooms and local places" },
  { title: "Work & Study", emoji: "💼", theme: "work and education", grammar: "present continuous; can/could", vocabularyBand: "jobs and learning" },
  { title: "Past Experiences", emoji: "📷", theme: "memories", grammar: "past simple; regular and irregular verbs", vocabularyBand: "past-time expressions" },
  { title: "Plans & Invitations", emoji: "📅", theme: "future plans", grammar: "going to; invitations; arrangements", vocabularyBand: "planning phrases" },
  { title: "Travel Problems", emoji: "🧳", theme: "travel disruptions", grammar: "past simple vs present perfect", vocabularyBand: "delays and solutions" },
  { title: "Stories & Sequencing", emoji: "📖", theme: "storytelling", grammar: "sequencers; past continuous", vocabularyBand: "narrative connectors" },
  { title: "Opinions & Reasons", emoji: "💬", theme: "opinions", grammar: "because; although; giving reasons", vocabularyBand: "opinion phrases" },
  { title: "Media & Technology", emoji: "📱", theme: "digital life", grammar: "present perfect; phrasal verbs", vocabularyBand: "technology and online life" },
  { title: "Environment & Community", emoji: "🌱", theme: "environment", grammar: "first conditional; quantifiers", vocabularyBand: "sustainability terms" },
  { title: "Health & Lifestyle", emoji: "🧘", theme: "wellbeing", grammar: "should; ought to; advice", vocabularyBand: "health collocations" },
  { title: "Culture & Traditions", emoji: "🎭", theme: "culture", grammar: "used to; passive introduction", vocabularyBand: "cultural practices" },
  { title: "Decisions & Possibilities", emoji: "🧩", theme: "choices", grammar: "second conditional; might/could", vocabularyBand: "possibility and consequence" },
  { title: "Explaining Processes", emoji: "⚙️", theme: "processes", grammar: "passive voice; sequencing", vocabularyBand: "process verbs" },
  { title: "Professional Communication", emoji: "📨", theme: "workplace communication", grammar: "formal requests; indirect questions", vocabularyBand: "professional register" },
  { title: "Negotiation & Compromise", emoji: "🤝", theme: "negotiation", grammar: "modals of obligation; concessions", vocabularyBand: "negotiation language" },
  { title: "News & Current Affairs", emoji: "📰", theme: "news", grammar: "reported speech; passive voice", vocabularyBand: "news and evidence" },
  { title: "Debate & Persuasion", emoji: "🎙️", theme: "argumentation", grammar: "hedging; contrast clauses", vocabularyBand: "persuasive language" },
  { title: "Science & Innovation", emoji: "🔬", theme: "innovation", grammar: "complex noun phrases; relative clauses", vocabularyBand: "technical concepts" },
  { title: "Society & Ethics", emoji: "⚖️", theme: "ethics", grammar: "mixed conditionals; nuance", vocabularyBand: "abstract and ethical terms" },
  { title: "Leadership & Strategy", emoji: "🧭", theme: "leadership", grammar: "emphasis; inversion", vocabularyBand: "strategic collocations" },
  { title: "Literature & Interpretation", emoji: "📚", theme: "interpretation", grammar: "subjunctive patterns; modality", vocabularyBand: "literary language" },
  { title: "Complex Social Situations", emoji: "🌐", theme: "social nuance", grammar: "register shifts; idiomatic clauses", vocabularyBand: "idioms and pragmatics" },
  { title: "Fluent Expression & Synthesis", emoji: "✨", theme: "synthesis and nuance", grammar: "discourse markers; complex syntax", vocabularyBand: "advanced collocations and idioms" },
];
const cefrForUnit = (id: number): CEFR => id <= 6 ? "A1" : id <= 12 ? "A2" : id <= 20 ? "B1" : id <= 30 ? "B2" : "C1";
export const UNITS: CurriculumUnit[] = UNIT_SEEDS.map((u, i) => ({ ...u, id: i + 1, cefr: cefrForUnit(i + 1) }));
export function curriculumUnit(unitIndex: number): CurriculumUnit {
  if (unitIndex < UNITS.length) return UNITS[unitIndex]!;
  const id = unitIndex + 1;
  return { id, title: `Advanced generated practice ${id}`, emoji: "✨", theme: "adaptive mixed practice", grammar: "adaptive review and extension", vocabularyBand: "generated vocabulary above current mastery", cefr: cefrForUnit(id) };
}
export const NODES_PER_UNIT = 3;
export const CONCEPTS_PER_NODE = 3;

// Column order of every row below.
const COLS: TargetLang[] = ["en", "es", "fr", "de", "it", "pt", "ja"];
type Row = [string, string, string, string, string, string, string];

// 5 units x 9 concepts. Every concept is used in exactly ONE unit/lesson, so no
// phrase is ever repeated across units. Each lesson (node) owns 3 concepts.
const DATA: Row[][] = [
  // Unit 1 — Greetings & Politeness
  [
    ["Hello", "Hola", "Salut", "Hallo", "Ciao", "Olá", "こんにちは"],
    ["Good morning", "Buenos días", "Bonjour", "Guten Morgen", "Buongiorno", "Bom dia", "おはようございます"],
    ["Good night", "Buenas noches", "Bonne nuit", "Gute Nacht", "Buonanotte", "Boa noite", "おやすみなさい"],
    ["Thank you very much", "Muchas gracias", "Merci beaucoup", "Vielen Dank", "Grazie mille", "Muito obrigado", "どうもありがとうございます"],
    ["You're welcome", "De nada", "De rien", "Gern geschehen", "Prego", "De nada", "どういたしまして"],
    ["Nice to meet you", "Mucho gusto", "Enchanté", "Freut mich", "Piacere", "Prazer em conhecê-lo", "はじめまして"],
    ["My name is Ana", "Me llamo Ana", "Je m'appelle Ana", "Ich heiße Ana", "Mi chiamo Ana", "Chamo-me Ana", "私はアナです"],
    ["See you tomorrow", "Hasta mañana", "À demain", "Bis morgen", "A domani", "Até amanhã", "また明日"],
    ["Excuse me", "Disculpe", "Excusez-moi", "Entschuldigung", "Mi scusi", "Com licença", "すみません"],
  ],
  // Unit 2 — Cafés & Food
  [
    ["A coffee, please", "Un café, por favor", "Un café, s'il vous plaît", "Einen Kaffee, bitte", "Un caffè, per favore", "Um café, por favor", "コーヒーをください"],
    ["The bill, please", "La cuenta, por favor", "L'addition, s'il vous plaît", "Die Rechnung, bitte", "Il conto, per favore", "A conta, por favor", "お会計をお願いします"],
    ["I would like some water", "Quisiera agua", "Je voudrais de l'eau", "Ich möchte Wasser", "Vorrei dell'acqua", "Queria água", "水をください"],
    ["Is the soup hot?", "¿La sopa está caliente?", "La soupe est-elle chaude ?", "Ist die Suppe heiß?", "La zuppa è calda?", "A sopa está quente?", "スープは熱いですか"],
    ["I am vegetarian", "Soy vegetariano", "Je suis végétarien", "Ich bin Vegetarier", "Sono vegetariano", "Sou vegetariano", "私はベジタリアンです"],
    ["A table for two, please", "Una mesa para dos, por favor", "Une table pour deux, s'il vous plaît", "Einen Tisch für zwei, bitte", "Un tavolo per due, per favore", "Uma mesa para dois, por favor", "二人用のテーブルをお願いします"],
    ["The food is delicious", "La comida está deliciosa", "La nourriture est délicieuse", "Das Essen ist köstlich", "Il cibo è delizioso", "A comida está deliciosa", "料理はとてもおいしいです"],
    ["No sugar, please", "Sin azúcar, por favor", "Sans sucre, s'il vous plaît", "Ohne Zucker, bitte", "Senza zucchero, per favore", "Sem açúcar, por favor", "砂糖なしでお願いします"],
    ["Can I pay by card?", "¿Puedo pagar con tarjeta?", "Puis-je payer par carte ?", "Kann ich mit Karte zahlen?", "Posso pagare con la carta?", "Posso pagar com cartão?", "カードで払えますか"],
  ],
  // Unit 3 — Directions & Transport
  [
    ["Where is the station?", "¿Dónde está la estación?", "Où est la gare ?", "Wo ist der Bahnhof?", "Dov'è la stazione?", "Onde fica a estação?", "駅はどこですか"],
    ["Turn left", "Gire a la izquierda", "Tournez à gauche", "Biegen Sie links ab", "Giri a sinistra", "Vire à esquerda", "左に曲がってください"],
    ["Turn right", "Gire a la derecha", "Tournez à droite", "Biegen Sie rechts ab", "Giri a destra", "Vire à direita", "右に曲がってください"],
    ["Go straight ahead", "Siga todo recto", "Allez tout droit", "Gehen Sie geradeaus", "Vada sempre dritto", "Siga em frente", "まっすぐ行ってください"],
    ["How far is it?", "¿A qué distancia está?", "C'est loin ?", "Wie weit ist es?", "Quanto è lontano?", "Fica longe?", "どのくらい遠いですか"],
    ["Is it near here?", "¿Está cerca de aquí?", "C'est près d'ici ?", "Ist es hier in der Nähe?", "È qui vicino?", "Fica perto daqui?", "ここから近いですか"],
    ["I am lost", "Estoy perdido", "Je suis perdu", "Ich habe mich verlaufen", "Mi sono perso", "Estou perdido", "道に迷いました"],
    ["Which bus goes downtown?", "¿Qué autobús va al centro?", "Quel bus va au centre-ville ?", "Welcher Bus fährt in die Innenstadt?", "Quale autobus va in centro?", "Qual autocarro vai ao centro?", "どのバスが中心街に行きますか"],
    ["Stop here, please", "Pare aquí, por favor", "Arrêtez-vous ici, s'il vous plaît", "Halten Sie hier, bitte", "Si fermi qui, per favore", "Pare aqui, por favor", "ここで止めてください"],
  ],
  // Unit 4 — Shopping & Hotels
  [
    ["How much is it?", "¿Cuánto cuesta?", "C'est combien ?", "Wie viel kostet das?", "Quanto costa?", "Quanto custa?", "いくらですか"],
    ["It is too expensive", "Es demasiado caro", "C'est trop cher", "Das ist zu teuer", "È troppo caro", "É demasiado caro", "高すぎます"],
    ["Do you have a smaller size?", "¿Tiene una talla más pequeña?", "Avez-vous une taille plus petite ?", "Haben Sie eine kleinere Größe?", "Avete una taglia più piccola?", "Tem um tamanho mais pequeno?", "もっと小さいサイズはありますか"],
    ["I am just looking", "Solo estoy mirando", "Je regarde seulement", "Ich schaue nur", "Sto solo guardando", "Estou só a ver", "見ているだけです"],
    ["I have a reservation", "Tengo una reserva", "J'ai une réservation", "Ich habe eine Reservierung", "Ho una prenotazione", "Tenho uma reserva", "予約しています"],
    ["What time is breakfast?", "¿A qué hora es el desayuno?", "À quelle heure est le petit-déjeuner ?", "Um wie viel Uhr ist das Frühstück?", "A che ora è la colazione?", "A que horas é o pequeno-almoço?", "朝食は何時ですか"],
    ["The room key, please", "La llave de la habitación, por favor", "La clé de la chambre, s'il vous plaît", "Den Zimmerschlüssel, bitte", "La chiave della camera, per favore", "A chave do quarto, por favor", "部屋の鍵をお願いします"],
    ["Can I try it on?", "¿Puedo probármelo?", "Puis-je l'essayer ?", "Kann ich es anprobieren?", "Posso provarlo?", "Posso experimentar?", "試着してもいいですか"],
    ["Do you take cash?", "¿Aceptan efectivo?", "Acceptez-vous les espèces ?", "Nehmen Sie Bargeld?", "Accettate contanti?", "Aceitam dinheiro?", "現金は使えますか"],
  ],
  // Unit 5 — Health & Emergencies
  [
    ["I need help", "Necesito ayuda", "J'ai besoin d'aide", "Ich brauche Hilfe", "Ho bisogno di aiuto", "Preciso de ajuda", "助けてください"],
    ["Call a doctor", "Llame a un médico", "Appelez un médecin", "Rufen Sie einen Arzt", "Chiami un medico", "Chame um médico", "医者を呼んでください"],
    ["I feel sick", "Me siento mal", "Je me sens mal", "Mir ist schlecht", "Mi sento male", "Sinto-me mal", "気分が悪いです"],
    ["My head hurts", "Me duele la cabeza", "J'ai mal à la tête", "Ich habe Kopfschmerzen", "Ho mal di testa", "Dói-me a cabeça", "頭が痛いです"],
    ["I am allergic to nuts", "Soy alérgico a los frutos secos", "Je suis allergique aux noix", "Ich bin allergisch gegen Nüsse", "Sono allergico alle noci", "Sou alérgico a frutos secos", "ナッツアレルギーです"],
    ["Call the police", "Llame a la policía", "Appelez la police", "Rufen Sie die Polizei", "Chiami la polizia", "Chame a polícia", "警察を呼んでください"],
    ["Where is the pharmacy?", "¿Dónde está la farmacia?", "Où est la pharmacie ?", "Wo ist die Apotheke?", "Dov'è la farmacia?", "Onde fica a farmácia?", "薬局はどこですか"],
    ["It's an emergency", "Es una emergencia", "C'est une urgence", "Es ist ein Notfall", "È un'emergenza", "É uma emergência", "緊急事態です"],
    ["I lost my passport", "He perdido mi pasaporte", "J'ai perdu mon passeport", "Ich habe meinen Pass verloren", "Ho perso il passaporto", "Perdi o meu passaporte", "パスポートをなくしました"],
  ],
];

export type Concept = { id: string; unit: number; node: number; tr: Record<TargetLang, string> };

export const CONCEPTS: Concept[] = DATA.flatMap((rows, unit) =>
  rows.map((row, c) => ({
    id: `u${unit}c${c}`,
    unit,
    node: Math.floor(c / CONCEPTS_PER_NODE),
    tr: Object.fromEntries(COLS.map((l, i) => [l, row[i]!])) as Record<TargetLang, string>,
  })),
);

export const unitConcepts = (unit: number) => CONCEPTS.filter((c) => c.unit === unit);
export const nodeConcepts = (unit: number, node: number) => CONCEPTS.filter((c) => c.unit === unit && c.node === node);
