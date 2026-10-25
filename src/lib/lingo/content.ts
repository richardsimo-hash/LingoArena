export type TargetLang = "es" | "fr" | "en" | "de" | "it" | "ja" | "pt";
export type NativeLang = "en" | "es" | "fr" | "de" | "it" | "pt";
export type PersonaId = "barista" | "gatekeeper" | "guide";
import type { Cefr, Row, Titles, UnitDef } from "./curriculum/types";
import { A1 } from "./curriculum/a1";
import { A2 } from "./curriculum/a2";
import { B1 } from "./curriculum/b1";
import { B2 } from "./curriculum/b2";

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

export type { Cefr } from "./curriculum/types";

/**
 * 100 units, 3 lessons each, 3 new phrases per lesson, ordered by CEFR level:
 * A1 = units 1-29, A2 = 30-53, B1 = 54-77, B2 = 78-100. Units 1-5 are the original course
 * (kept first so saved progress, stored as lesson indexes, stays valid).
 * Titles for units 1-5 are translated in i18n.ts; later units carry their own `titles`.
 */
const CURRICULUM: UnitDef[] = [...A1, ...A2, ...B1, ...B2];
export type Unit = { title: string; emoji: string; level: Cefr; focus: string; titles?: Titles };
export const UNITS: Unit[] = [
  { title: "Greetings & Politeness", emoji: "👋", level: "A1", focus: "Greetings, thanks and introductions" },
  { title: "Cafés & Food", emoji: "🥐", level: "A1", focus: "Ordering food and drinks politely" },
  { title: "Directions & Transport", emoji: "🧭", level: "A1", focus: "Asking where things are and getting around" },
  { title: "Shopping & Hotels", emoji: "🛍️", level: "A1", focus: "Prices, sizes and hotel basics" },
  { title: "Health & Emergencies", emoji: "🚑", level: "A1", focus: "Asking for help and describing symptoms" },
  ...CURRICULUM.map((unit) => ({ title: unit.title[0], emoji: unit.emoji, level: unit.level, focus: unit.focus, titles: unit.title })),
];
export const CEFR_LEVELS: { level: Cefr; label: string; first: number; last: number }[] = (["A1", "A2", "B1", "B2"] as const).map((level) => ({
  level,
  label: { A1: "Beginner", A2: "Elementary", B1: "Intermediate", B2: "Upper-intermediate" }[level],
  first: UNITS.findIndex((unit) => unit.level === level),
  last: UNITS.length - 1 - [...UNITS].reverse().findIndex((unit) => unit.level === level),
}));
export const NODES_PER_UNIT = 3;
export const CONCEPTS_PER_NODE = 3;

// Column order of every row below.
const COLS: TargetLang[] = ["en", "es", "fr", "de", "it", "pt", "ja"];

// Units 1-5 (9 concepts each); units 6-100 come from ./curriculum. Every concept is used in
// exactly ONE unit/lesson, so no phrase is ever repeated. Each lesson (node) owns 3 concepts.
const ORIGINAL: Row[][] = [
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

const DATA: Row[][] = [...ORIGINAL, ...CURRICULUM.map((unit) => unit.rows)];

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

/**
 * Phrases a learner has reached, for the practice modes (Speech Arena, Grammar Battle, Fire Combo):
 * every unit up to two past their furthest finished lesson, and always at least units 1-5,
 * so beginners are not handed B2 idioms while advanced learners still get variety.
 */
export function practiceConcepts(done: number[]): Concept[] {
  const furthest = done.length ? Math.floor(Math.max(...done) / NODES_PER_UNIT) : 0;
  const lastUnit = Math.min(UNITS.length - 1, Math.max(4, furthest + 2));
  return CONCEPTS.filter((c) => c.unit <= lastUnit);
}
