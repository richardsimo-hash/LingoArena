import type { Cefr, NativeLang } from "./content";

/**
 * Roleplay missions (Free Talk): the tutor plays a role in a scene and the learner has three
 * goals to achieve by speaking. `role`, `scene` and goal `ai` text brief the AI (English);
 * `title` and goal `label` are shown to the learner (English and Spanish; other languages use English).
 */
export type MissionGoal = { id: string; ai: string; label: { en: string; es: string } };
export type Mission = { id: string; emoji: string; level: Cefr; unit: number; title: { en: string; es: string }; role: string; scene: string; goals: [MissionGoal, MissionGoal, MissionGoal] };

const g = (id: string, ai: string, en: string, es: string): MissionGoal => ({ id, ai, label: { en, es } });

export const MISSIONS: Mission[] = [
  { id: "cafe", emoji: "☕", level: "A1", unit: 1, title: { en: "Order at a café", es: "Pide en una cafetería" }, role: "a friendly barista at a busy café", scene: "The learner is a customer at the counter.",
    goals: [g("g1", "orders a drink", "Order a drink", "Pide una bebida"), g("g2", "asks how much it costs", "Ask the price", "Pregunta el precio"), g("g3", "says how they will pay or pays", "Pay for it", "Paga")] },
  { id: "meet", emoji: "👋", level: "A1", unit: 0, title: { en: "Meet a new classmate", es: "Conoce a un compañero" }, role: "a new classmate on the first day of a language course", scene: "You meet the learner before class starts.",
    goals: [g("g1", "says their name", "Say your name", "Di tu nombre"), g("g2", "says where they are from", "Say where you're from", "Di de dónde eres"), g("g3", "asks you a question about yourself", "Ask a question back", "Haz una pregunta")] },
  { id: "directions", emoji: "🧭", level: "A1", unit: 2, title: { en: "Find the station", es: "Encuentra la estación" }, role: "a helpful local on the street", scene: "The learner is lost and needs the train station.",
    goals: [g("g1", "politely gets your attention (excuse me / sorry)", "Get attention politely", "Llama la atención con educación"), g("g2", "asks where the station is", "Ask for the station", "Pregunta por la estación"), g("g3", "asks how far it is or how long it takes", "Ask how far it is", "Pregunta a qué distancia está")] },
  { id: "shop", emoji: "🛍️", level: "A1", unit: 3, title: { en: "Buy a T-shirt", es: "Compra una camiseta" }, role: "a shop assistant in a clothes shop", scene: "The learner wants a T-shirt.",
    goals: [g("g1", "says what they are looking for (item and colour)", "Say what you want and the colour", "Di qué buscas y el color"), g("g2", "asks for a different size or to try it on", "Ask for a size or to try it on", "Pide una talla o probártela"), g("g3", "decides to buy it or not and says so", "Decide and say it", "Decide y dilo")] },
  { id: "hotel", emoji: "🏨", level: "A2", unit: 34, title: { en: "Check in at a hotel", es: "Registrarse en un hotel" }, role: "a hotel receptionist", scene: "The learner arrives at the hotel with a booking.",
    goals: [g("g1", "says they have a reservation and gives a name", "Say you have a booking", "Di que tienes reserva"), g("g2", "asks what time breakfast is", "Ask about breakfast time", "Pregunta la hora del desayuno"), g("g3", "asks for the Wi-Fi password or another service", "Ask for the Wi-Fi or a service", "Pide el wifi u otro servicio")] },
  { id: "restaurant", emoji: "🍽️", level: "A2", unit: 36, title: { en: "Dinner at a restaurant", es: "Cena en un restaurante" }, role: "a waiter at a restaurant", scene: "The learner has just sat down for dinner.",
    goals: [g("g1", "asks for a recommendation", "Ask for a recommendation", "Pide una recomendación"), g("g2", "orders a main course and a drink", "Order food and a drink", "Pide comida y bebida"), g("g3", "mentions a dietary need or allergy", "Mention an allergy or diet", "Menciona una alergia o dieta")] },
  { id: "doctor", emoji: "🩺", level: "A2", unit: 39, title: { en: "See a doctor", es: "Ve al médico" }, role: "a calm doctor at a clinic", scene: "The learner does not feel well.",
    goals: [g("g1", "describes a symptom", "Describe a symptom", "Describe un síntoma"), g("g2", "says since when it started", "Say since when", "Di desde cuándo"), g("g3", "asks what they should do or take", "Ask what to do", "Pregunta qué hacer")] },
  { id: "plans", emoji: "📲", level: "A2", unit: 41, title: { en: "Make weekend plans", es: "Haz planes para el finde" }, role: "the learner's friend", scene: "You are chatting about the weekend.",
    goals: [g("g1", "suggests an activity", "Suggest an activity", "Propón una actividad"), g("g2", "agrees a day and time", "Agree a day and time", "Acordad día y hora"), g("g3", "agrees where to meet", "Agree where to meet", "Acordad dónde quedar")] },
  { id: "flat", emoji: "🔑", level: "A2", unit: 44, title: { en: "Rent a flat", es: "Alquila un piso" }, role: "a landlord showing a flat", scene: "The learner is visiting a flat to rent.",
    goals: [g("g1", "asks how much the rent is", "Ask the rent", "Pregunta el alquiler"), g("g2", "asks if bills are included or if it is furnished", "Ask about bills or furniture", "Pregunta por gastos o muebles"), g("g3", "asks when they could move in", "Ask when you can move in", "Pregunta cuándo puedes mudarte")] },
  { id: "interview", emoji: "👔", level: "B1", unit: 56, title: { en: "Job interview", es: "Entrevista de trabajo" }, role: "a friendly but professional interviewer", scene: "Interview for a job the learner wants.",
    goals: [g("g1", "describes their experience", "Describe your experience", "Describe tu experiencia"), g("g2", "names a strength with an example", "Give a strength with an example", "Da un punto fuerte con ejemplo"), g("g3", "asks the interviewer a question", "Ask the interviewer a question", "Haz una pregunta al entrevistador")] },
  { id: "complaint", emoji: "📦", level: "B1", unit: 74, title: { en: "Return a faulty product", es: "Devuelve un producto defectuoso" }, role: "a customer service agent", scene: "The learner bought something that does not work.",
    goals: [g("g1", "explains what is wrong", "Explain the problem", "Explica el problema"), g("g2", "says when or where they bought it", "Say when you bought it", "Di cuándo lo compraste"), g("g3", "asks for a refund or replacement", "Ask for a refund or replacement", "Pide reembolso o cambio")] },
  { id: "advice", emoji: "💡", level: "B1", unit: 56, title: { en: "Help a friend decide", es: "Ayuda a un amigo a decidir" }, role: "a friend who can't decide whether to move to another city for a job", scene: "Your friend asks the learner for advice.",
    goals: [g("g1", "gives advice using should / if I were you", "Give advice", "Da un consejo"), g("g2", "mentions an advantage and a disadvantage", "Weigh a pro and a con", "Menciona una ventaja y una desventaja"), g("g3", "asks a follow-up question about feelings or plans", "Ask a follow-up question", "Haz una pregunta de seguimiento")] },
  { id: "story", emoji: "📖", level: "B1", unit: 60, title: { en: "Tell a travel story", es: "Cuenta una historia de viaje" }, role: "a curious friend at dinner", scene: "You ask the learner about a memorable trip.",
    goals: [g("g1", "says where and when it happened (past tense)", "Say where and when", "Di dónde y cuándo"), g("g2", "describes something that went wrong or surprised them", "Describe a surprise or problem", "Describe un imprevisto"), g("g3", "says how it ended or how they felt", "Say how it ended", "Di cómo terminó")] },
  { id: "negotiate", emoji: "🤝", level: "B2", unit: 81, title: { en: "Negotiate a price", es: "Negocia un precio" }, role: "a seller of a second-hand bike who wants a good price", scene: "The learner wants to buy the bike for less.",
    goals: [g("g1", "makes a counter-offer", "Make a counter-offer", "Haz una contraoferta"), g("g2", "justifies the offer with a reason", "Justify your offer", "Justifica tu oferta"), g("g3", "reaches an agreement or politely walks away", "Close the deal or walk away", "Cierra el trato o retírate")] },
  { id: "meeting", emoji: "🧑‍💼", level: "B2", unit: 82, title: { en: "Lead a short meeting", es: "Dirige una reunión breve" }, role: "a colleague in a team meeting the learner is running", scene: "Planning next month's project.",
    goals: [g("g1", "states the purpose of the meeting", "State the purpose", "Explica el objetivo"), g("g2", "asks for your opinion or input", "Ask for input", "Pide opiniones"), g("g3", "summarises the agreed next steps", "Summarise next steps", "Resume los próximos pasos")] },
  { id: "debate", emoji: "🗣️", level: "B2", unit: 77, title: { en: "Friendly debate", es: "Debate amistoso" }, role: "a friend who thinks social media does more harm than good", scene: "A relaxed debate over coffee.",
    goals: [g("g1", "states a clear opinion", "State your opinion", "Da tu opinión"), g("g2", "supports it with an example or evidence", "Support it with an example", "Apóyala con un ejemplo"), g("g3", "acknowledges your point before disagreeing (concedes partly)", "Concede a point, then disagree", "Concede un punto y luego discrepa")] },
];

export const missionText = (text: { en: string; es: string }, native: NativeLang) => (native === "es" ? text.es : text.en);
