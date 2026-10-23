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

// 30 authored units x 9 concepts (CEFR A1 to B2). Units beyond 30 use adaptive/generated C1 practice. Every concept is used in exactly ONE unit/lesson, so no
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
  // Unit 6 — Daily Routines
  [
    ["I wake up at seven", "Me despierto a las siete", "Je me réveille à sept heures", "Ich wache um sieben Uhr auf", "Mi sveglio alle sette", "Acordo às sete", "私は七時に起きます"],
    ["I take a shower", "Me ducho", "Je prends une douche", "Ich dusche", "Faccio la doccia", "Tomo banho", "シャワーを浴びます"],
    ["I have breakfast at home", "Desayuno en casa", "Je prends le petit-déjeuner à la maison", "Ich frühstücke zu Hause", "Faccio colazione a casa", "Tomo o pequeno-almoço em casa", "家で朝ごはんを食べます"],
    ["I go to work by bus", "Voy al trabajo en autobús", "Je vais au travail en bus", "Ich fahre mit dem Bus zur Arbeit", "Vado al lavoro in autobus", "Vou para o trabalho de autocarro", "バスで仕事に行きます"],
    ["I usually eat lunch at noon", "Normalmente almuerzo a mediodía", "En général, je déjeune à midi", "Normalerweise esse ich um zwölf Uhr zu Mittag", "Di solito pranzo a mezzogiorno", "Normalmente almoço ao meio-dia", "いつも正午に昼ごはんを食べます"],
    ["I never drink coffee at night", "Nunca tomo café por la noche", "Je ne bois jamais de café le soir", "Ich trinke abends nie Kaffee", "Non bevo mai caffè la sera", "Nunca bebo café à noite", "夜はコーヒーを飲みません"],
    ["I study in the evening", "Estudio por la tarde", "J'étudie le soir", "Ich lerne am Abend", "Studio la sera", "Estudo ao fim do dia", "夕方に勉強します"],
    ["I go to bed at eleven", "Me acuesto a las once", "Je me couche à onze heures", "Ich gehe um elf Uhr ins Bett", "Vado a letto alle undici", "Deito-me às onze", "十一時に寝ます"],
    ["On weekends I sleep late", "Los fines de semana duermo hasta tarde", "Le week-end, je dors tard", "Am Wochenende schlafe ich lange", "Nel fine settimana dormo fino a tardi", "Ao fim de semana durmo até tarde", "週末は遅くまで寝ます"],
  ],
  // Unit 7 — Family & Relationships
  [
    ["This is my mother", "Esta es mi madre", "Voici ma mère", "Das ist meine Mutter", "Questa è mia madre", "Esta é a minha mãe", "こちらは私の母です"],
    ["I have two brothers", "Tengo dos hermanos", "J'ai deux frères", "Ich habe zwei Brüder", "Ho due fratelli", "Tenho dois irmãos", "兄弟が二人います"],
    ["My sister is older than me", "Mi hermana es mayor que yo", "Ma sœur est plus âgée que moi", "Meine Schwester ist älter als ich", "Mia sorella è più grande di me", "A minha irmã é mais velha do que eu", "姉は私より年上です"],
    ["My father works in a hospital", "Mi padre trabaja en un hospital", "Mon père travaille dans un hôpital", "Mein Vater arbeitet in einem Krankenhaus", "Mio padre lavora in un ospedale", "O meu pai trabalha num hospital", "父は病院で働いています"],
    ["We have a small family", "Tenemos una familia pequeña", "Nous avons une petite famille", "Wir haben eine kleine Familie", "Abbiamo una famiglia piccola", "Temos uma família pequena", "私たちは小さな家族です"],
    ["My grandparents live in the countryside", "Mis abuelos viven en el campo", "Mes grands-parents vivent à la campagne", "Meine Großeltern leben auf dem Land", "I miei nonni vivono in campagna", "Os meus avós vivem no campo", "祖父母は田舎に住んでいます"],
    ["She is my best friend", "Ella es mi mejor amiga", "C'est ma meilleure amie", "Sie ist meine beste Freundin", "Lei è la mia migliore amica", "Ela é a minha melhor amiga", "彼女は私の親友です"],
    ["My cousin is very funny", "Mi primo es muy gracioso", "Mon cousin est très drôle", "Mein Cousin ist sehr lustig", "Mio cugino è molto simpatico", "O meu primo é muito engraçado", "いとこはとても面白いです"],
    ["Do you have any children?", "¿Tiene hijos?", "Avez-vous des enfants ?", "Haben Sie Kinder?", "Ha figli?", "Tem filhos?", "お子さんはいますか"],
  ],
  // Unit 8 — Home & Neighbourhood
  [
    ["I live in an apartment", "Vivo en un apartamento", "J'habite dans un appartement", "Ich wohne in einer Wohnung", "Vivo in un appartamento", "Vivo num apartamento", "私はアパートに住んでいます"],
    ["There are three bedrooms", "Hay tres dormitorios", "Il y a trois chambres", "Es gibt drei Schlafzimmer", "Ci sono tre camere da letto", "Há três quartos", "寝室が三つあります"],
    ["The kitchen is very big", "La cocina es muy grande", "La cuisine est très grande", "Die Küche ist sehr groß", "La cucina è molto grande", "A cozinha é muito grande", "キッチンはとても広いです"],
    ["Is there a supermarket nearby?", "¿Hay un supermercado cerca?", "Y a-t-il un supermarché près d'ici ?", "Gibt es hier in der Nähe einen Supermarkt?", "C'è un supermercato qui vicino?", "Há algum supermercado perto?", "近くにスーパーはありますか"],
    ["The bank is next to the park", "El banco está al lado del parque", "La banque est à côté du parc", "Die Bank ist neben dem Park", "La banca è accanto al parco", "O banco fica ao lado do parque", "銀行は公園の隣にあります"],
    ["My street is very quiet", "Mi calle es muy tranquila", "Ma rue est très calme", "Meine Straße ist sehr ruhig", "La mia strada è molto tranquilla", "A minha rua é muito sossegada", "私の通りはとても静かです"],
    ["The window is open", "La ventana está abierta", "La fenêtre est ouverte", "Das Fenster ist offen", "La finestra è aperta", "A janela está aberta", "窓が開いています"],
    ["The keys are on the table", "Las llaves están sobre la mesa", "Les clés sont sur la table", "Die Schlüssel liegen auf dem Tisch", "Le chiavi sono sul tavolo", "As chaves estão em cima da mesa", "鍵はテーブルの上にあります"],
    ["My neighbours are friendly", "Mis vecinos son amables", "Mes voisins sont sympathiques", "Meine Nachbarn sind freundlich", "I miei vicini sono gentili", "Os meus vizinhos são simpáticos", "近所の人は親切です"],
  ],
  // Unit 9 — Work & Study
  [
    ["I work in an office", "Trabajo en una oficina", "Je travaille dans un bureau", "Ich arbeite in einem Büro", "Lavoro in un ufficio", "Trabalho num escritório", "私は事務所で働いています"],
    ["I am a student", "Soy estudiante", "Je suis étudiant", "Ich bin Student", "Sono studente", "Sou estudante", "私は学生です"],
    ["What do you do for a living?", "¿A qué se dedica?", "Que faites-vous dans la vie ?", "Was machen Sie beruflich?", "Che lavoro fa?", "O que faz na vida?", "お仕事は何ですか"],
    ["I have a meeting at ten", "Tengo una reunión a las diez", "J'ai une réunion à dix heures", "Ich habe um zehn Uhr ein Meeting", "Ho una riunione alle dieci", "Tenho uma reunião às dez", "十時に会議があります"],
    ["I am studying engineering", "Estoy estudiando ingeniería", "J'étudie l'ingénierie", "Ich studiere Ingenieurwesen", "Studio ingegneria", "Estou a estudar engenharia", "私は工学を勉強しています"],
    ["Can you send me the file?", "¿Puede enviarme el archivo?", "Pouvez-vous m'envoyer le fichier ?", "Können Sie mir die Datei schicken?", "Può inviarmi il file?", "Pode enviar-me o ficheiro?", "ファイルを送っていただけますか"],
    ["I need to finish this report", "Necesito terminar este informe", "Je dois finir ce rapport", "Ich muss diesen Bericht fertigstellen", "Devo finire questo rapporto", "Preciso de terminar este relatório", "このレポートを仕上げなければなりません"],
    ["The class starts at nine", "La clase empieza a las nueve", "Le cours commence à neuf heures", "Der Unterricht beginnt um neun Uhr", "La lezione inizia alle nove", "A aula começa às nove", "授業は九時に始まります"],
    ["I have an exam tomorrow", "Tengo un examen mañana", "J'ai un examen demain", "Ich habe morgen eine Prüfung", "Ho un esame domani", "Tenho um exame amanhã", "明日試験があります"],
  ],
  // Unit 10 — Past Experiences
  [
    ["Yesterday I visited a museum", "Ayer visité un museo", "Hier, j'ai visité un musée", "Gestern habe ich ein Museum besucht", "Ieri ho visitato un museo", "Ontem visitei um museu", "昨日、博物館に行きました"],
    ["Last year I travelled to Italy", "El año pasado viajé a Italia", "L'année dernière, j'ai voyagé en Italie", "Letztes Jahr bin ich nach Italien gereist", "L'anno scorso ho viaggiato in Italia", "No ano passado viajei para Itália", "去年イタリアに旅行しました"],
    ["I played football as a child", "De niño jugaba al fútbol", "Enfant, je jouais au football", "Als Kind habe ich Fußball gespielt", "Da bambino giocavo a calcio", "Em criança, jogava futebol", "子供のころ、サッカーをしていました"],
    ["We watched a great film", "Vimos una película genial", "Nous avons regardé un super film", "Wir haben einen tollen Film gesehen", "Abbiamo guardato un film fantastico", "Vimos um filme ótimo", "素晴らしい映画を見ました"],
    ["I forgot my umbrella", "Olvidé mi paraguas", "J'ai oublié mon parapluie", "Ich habe meinen Regenschirm vergessen", "Ho dimenticato il mio ombrello", "Esqueci-me do guarda-chuva", "傘を忘れました"],
    ["She cooked dinner last night", "Ella preparó la cena anoche", "Elle a préparé le dîner hier soir", "Sie hat gestern Abend das Abendessen gekocht", "Ieri sera ha preparato la cena", "Ela preparou o jantar ontem à noite", "彼女は昨夜、夕食を作りました"],
    ["I met him two years ago", "Lo conocí hace dos años", "Je l'ai rencontré il y a deux ans", "Ich habe ihn vor zwei Jahren kennengelernt", "L'ho conosciuto due anni fa", "Conheci-o há dois anos", "二年前に彼に会いました"],
    ["It rained all weekend", "Llovió todo el fin de semana", "Il a plu tout le week-end", "Es hat das ganze Wochenende geregnet", "Ha piovuto per tutto il fine settimana", "Choveu o fim de semana todo", "週末はずっと雨でした"],
    ["I was very tired yesterday", "Ayer estaba muy cansado", "Hier, j'étais très fatigué", "Gestern war ich sehr müde", "Ieri ero molto stanco", "Ontem estava muito cansado", "昨日はとても疲れていました"],
  ],
  // Unit 11 — Plans & Invitations
  [
    ["I am going to visit my aunt on Sunday", "Voy a visitar a mi tía el domingo", "Je vais rendre visite à ma tante dimanche", "Ich werde am Sonntag meine Tante besuchen", "Domenica vado a trovare mia zia", "Vou visitar a minha tia no domingo", "日曜日に叔母を訪ねるつもりです"],
    ["Would you like to come to dinner?", "¿Le gustaría venir a cenar?", "Voulez-vous venir dîner ?", "Möchten Sie zum Abendessen kommen?", "Le va di venire a cena?", "Gostaria de vir jantar?", "夕食に来ませんか"],
    ["Let's meet at six o'clock", "Quedemos a las seis", "Retrouvons-nous à six heures", "Treffen wir uns um sechs Uhr", "Ci vediamo alle sei", "Encontramo-nos às seis", "六時に会いましょう"],
    ["I can't come on Friday", "No puedo ir el viernes", "Je ne peux pas venir vendredi", "Am Freitag kann ich nicht kommen", "Venerdì non posso venire", "Na sexta-feira não posso ir", "金曜日は行けません"],
    ["What are you doing this weekend?", "¿Qué hace este fin de semana?", "Que faites-vous ce week-end ?", "Was machen Sie dieses Wochenende?", "Cosa fa questo fine settimana?", "O que faz neste fim de semana?", "今週末は何をしますか"],
    ["We are going to the beach tomorrow", "Mañana vamos a la playa", "Demain, nous allons à la plage", "Morgen fahren wir an den Strand", "Domani andiamo in spiaggia", "Amanhã vamos à praia", "明日は海に行きます"],
    ["Thank you for the invitation", "Gracias por la invitación", "Merci pour l'invitation", "Danke für die Einladung", "Grazie per l'invito", "Obrigado pelo convite", "お招きありがとうございます"],
    ["I'm planning a small party", "Estoy organizando una pequeña fiesta", "J'organise une petite fête", "Ich plane eine kleine Feier", "Sto organizzando una piccola festa", "Estou a organizar uma pequena festa", "小さなパーティーを計画しています"],
    ["Maybe we can go to the cinema", "Quizás podamos ir al cine", "On pourrait peut-être aller au cinéma", "Vielleicht können wir ins Kino gehen", "Forse possiamo andare al cinema", "Talvez possamos ir ao cinema", "映画に行けるかもしれません"],
  ],
  // Unit 12 — Travel Problems
  [
    ["My flight has been cancelled", "Mi vuelo ha sido cancelado", "Mon vol a été annulé", "Mein Flug wurde gestrichen", "Il mio volo è stato cancellato", "O meu voo foi cancelado", "私の便が欠航になりました"],
    ["I missed the last train", "Perdí el último tren", "J'ai raté le dernier train", "Ich habe den letzten Zug verpasst", "Ho perso l'ultimo treno", "Perdi o último comboio", "終電を逃しました"],
    ["My suitcase hasn't arrived", "Mi maleta no ha llegado", "Ma valise n'est pas arrivée", "Mein Koffer ist nicht angekommen", "La mia valigia non è arrivata", "A minha mala não chegou", "私のスーツケースが届いていません"],
    ["The train is delayed by an hour", "El tren lleva una hora de retraso", "Le train a une heure de retard", "Der Zug hat eine Stunde Verspätung", "Il treno è in ritardo di un'ora", "O comboio está atrasado uma hora", "電車が一時間遅れています"],
    ["I have lost my wallet", "He perdido mi cartera", "J'ai perdu mon portefeuille", "Ich habe meine Geldbörse verloren", "Ho perso il portafoglio", "Perdi a minha carteira", "財布をなくしました"],
    ["Can you recommend another hotel?", "¿Puede recomendarme otro hotel?", "Pouvez-vous me recommander un autre hôtel ?", "Können Sie mir ein anderes Hotel empfehlen?", "Può consigliarmi un altro hotel?", "Pode recomendar-me outro hotel?", "別のホテルを教えていただけますか"],
    ["The taxi hasn't come yet", "El taxi todavía no ha llegado", "Le taxi n'est pas encore arrivé", "Das Taxi ist noch nicht gekommen", "Il taxi non è ancora arrivato", "O táxi ainda não chegou", "タクシーがまだ来ません"],
    ["I need to change my ticket", "Necesito cambiar mi billete", "Je dois changer mon billet", "Ich muss mein Ticket umbuchen", "Devo cambiare il mio biglietto", "Preciso de trocar o meu bilhete", "チケットを変更したいです"],
    ["Is there another flight today?", "¿Hay otro vuelo hoy?", "Y a-t-il un autre vol aujourd'hui ?", "Gibt es heute noch einen Flug?", "C'è un altro volo oggi?", "Há outro voo hoje?", "今日はほかの便がありますか"],
  ],
  // Unit 13 — Stories & Sequencing
  [
    ["First, I opened the door", "Primero, abrí la puerta", "D'abord, j'ai ouvert la porte", "Zuerst habe ich die Tür geöffnet", "Prima ho aperto la porta", "Primeiro, abri a porta", "まず、ドアを開けました"],
    ["Then I heard a strange noise", "Entonces oí un ruido extraño", "Puis j'ai entendu un bruit étrange", "Dann hörte ich ein seltsames Geräusch", "Poi ho sentito uno strano rumore", "Depois ouvi um barulho estranho", "それから変な音が聞こえました"],
    ["While I was cooking, the phone rang", "Mientras cocinaba, sonó el teléfono", "Pendant que je cuisinais, le téléphone a sonné", "Während ich kochte, klingelte das Telefon", "Mentre cucinavo, ha squillato il telefono", "Enquanto cozinhava, o telefone tocou", "料理をしている間に電話が鳴りました"],
    ["After that, we left the house", "Después de eso, salimos de casa", "Après cela, nous avons quitté la maison", "Danach haben wir das Haus verlassen", "Dopo di che siamo usciti di casa", "Depois disso, saímos de casa", "その後、私たちは家を出ました"],
    ["Suddenly, the lights went out", "De repente, se apagaron las luces", "Soudain, les lumières se sont éteintes", "Plötzlich ging das Licht aus", "All'improvviso si sono spente le luci", "De repente, as luzes apagaram-se", "突然、電気が消えました"],
    ["It was raining when we arrived", "Estaba lloviendo cuando llegamos", "Il pleuvait quand nous sommes arrivés", "Es regnete, als wir ankamen", "Pioveva quando siamo arrivati", "Estava a chover quando chegámos", "着いたとき、雨が降っていました"],
    ["Meanwhile, my brother was waiting outside", "Mientras tanto, mi hermano esperaba fuera", "Pendant ce temps, mon frère attendait dehors", "Währenddessen wartete mein Bruder draußen", "Nel frattempo, mio fratello aspettava fuori", "Entretanto, o meu irmão esperava lá fora", "その間、兄は外で待っていました"],
    ["Finally, everything was fine", "Al final, todo salió bien", "Finalement, tout s'est bien passé", "Am Ende war alles in Ordnung", "Alla fine è andato tutto bene", "No final, correu tudo bem", "最後には、すべてうまくいきました"],
    ["That was the end of the story", "Ese fue el final de la historia", "Voilà la fin de l'histoire", "Das war das Ende der Geschichte", "Questa è stata la fine della storia", "Esse foi o fim da história", "それが物語の終わりでした"],
  ],
  // Unit 14 — Opinions & Reasons
  [
    ["In my opinion, it is a good idea", "En mi opinión, es una buena idea", "À mon avis, c'est une bonne idée", "Meiner Meinung nach ist das eine gute Idee", "Secondo me è una buona idea", "Na minha opinião, é uma boa ideia", "私の意見では、それは良い考えです"],
    ["I agree with you completely", "Estoy totalmente de acuerdo con usted", "Je suis tout à fait d'accord avec vous", "Ich stimme Ihnen völlig zu", "Sono completamente d'accordo con Lei", "Concordo plenamente consigo", "あなたに完全に賛成です"],
    ["I don't think that's true", "No creo que eso sea verdad", "Je ne pense pas que ce soit vrai", "Ich glaube nicht, dass das stimmt", "Non credo che sia vero", "Não acho que isso seja verdade", "それは本当ではないと思います"],
    ["I prefer the train because it is cheaper", "Prefiero el tren porque es más barato", "Je préfère le train parce qu'il est moins cher", "Ich bevorzuge den Zug, weil er billiger ist", "Preferisco il treno perché costa meno", "Prefiro o comboio porque é mais barato", "安いので電車のほうが好きです"],
    ["Although it was late, we kept working", "Aunque era tarde, seguimos trabajando", "Bien qu'il fût tard, nous avons continué à travailler", "Obwohl es spät war, haben wir weitergearbeitet", "Anche se era tardi, abbiamo continuato a lavorare", "Embora fosse tarde, continuámos a trabalhar", "遅かったのですが、私たちは仕事を続けました"],
    ["That is exactly why I called", "Por eso mismo llamé", "C'est précisément pour cela que j'ai appelé", "Genau deshalb habe ich angerufen", "Ecco proprio perché ho chiamato", "É exatamente por isso que liguei", "だからこそ電話したのです"],
    ["It depends on the situation", "Depende de la situación", "Cela dépend de la situation", "Das hängt von der Situation ab", "Dipende dalla situazione", "Depende da situação", "状況によります"],
    ["There are advantages and disadvantages", "Hay ventajas y desventajas", "Il y a des avantages et des inconvénients", "Es gibt Vor- und Nachteile", "Ci sono vantaggi e svantaggi", "Há vantagens e desvantagens", "長所と短所があります"],
    ["What do you think about it?", "¿Qué piensa usted de eso?", "Qu'en pensez-vous ?", "Was halten Sie davon?", "Che cosa ne pensa?", "O que pensa disso?", "それについてどう思いますか"],
  ],
  // Unit 15 — Media & Technology
  [
    ["I have just downloaded the app", "Acabo de descargar la aplicación", "Je viens de télécharger l'application", "Ich habe gerade die App heruntergeladen", "Ho appena scaricato l'app", "Acabei de descarregar a aplicação", "アプリをダウンロードしたところです"],
    ["My phone has run out of battery", "Mi móvil se ha quedado sin batería", "Mon téléphone n'a plus de batterie", "Mein Handy hat keinen Akku mehr", "Il mio telefono si è scaricato", "O meu telemóvel ficou sem bateria", "携帯の電池が切れました"],
    ["Could you turn the volume down?", "¿Podría bajar el volumen?", "Pourriez-vous baisser le volume ?", "Könnten Sie die Lautstärke leiser stellen?", "Potrebbe abbassare il volume?", "Podia baixar o volume?", "音量を下げていただけますか"],
    ["I forgot my password again", "Olvidé mi contraseña otra vez", "J'ai encore oublié mon mot de passe", "Ich habe mein Passwort schon wieder vergessen", "Ho dimenticato di nuovo la password", "Esqueci-me outra vez da palavra-passe", "またパスワードを忘れました"],
    ["The video won't load", "El vídeo no carga", "La vidéo ne se charge pas", "Das Video lädt nicht", "Il video non si carica", "O vídeo não carrega", "動画が読み込めません"],
    ["I read the news online every morning", "Leo las noticias en internet cada mañana", "Je lis les actualités en ligne chaque matin", "Ich lese jeden Morgen die Nachrichten online", "Leggo le notizie online ogni mattina", "Leio as notícias online todas as manhãs", "毎朝ネットでニュースを読みます"],
    ["Please switch off your phone", "Por favor, apague su móvil", "Veuillez éteindre votre téléphone", "Bitte schalten Sie Ihr Handy aus", "Spenga il telefono, per favore", "Por favor, desligue o telemóvel", "携帯電話の電源を切ってください"],
    ["She posts photos every day", "Ella publica fotos todos los días", "Elle publie des photos tous les jours", "Sie postet jeden Tag Fotos", "Lei pubblica foto ogni giorno", "Ela publica fotografias todos os dias", "彼女は毎日写真を投稿しています"],
    ["The internet connection is very slow", "La conexión a internet es muy lenta", "La connexion internet est très lente", "Die Internetverbindung ist sehr langsam", "La connessione a internet è molto lenta", "A ligação à internet é muito lenta", "インターネットの接続がとても遅いです"],
  ],
  // Unit 16 — Environment & Community
  [
    ["If it rains, we will stay at home", "Si llueve, nos quedaremos en casa", "S'il pleut, nous resterons à la maison", "Wenn es regnet, bleiben wir zu Hause", "Se piove, restiamo a casa", "Se chover, ficamos em casa", "雨が降ったら、家にいます"],
    ["We should recycle more plastic", "Deberíamos reciclar más plástico", "Nous devrions recycler plus de plastique", "Wir sollten mehr Plastik recyceln", "Dovremmo riciclare più plastica", "Devíamos reciclar mais plástico", "もっとプラスチックをリサイクルするべきです"],
    ["I try to save water and energy", "Intento ahorrar agua y energía", "J'essaie d'économiser l'eau et l'énergie", "Ich versuche, Wasser und Energie zu sparen", "Cerco di risparmiare acqua ed energia", "Tento poupar água e energia", "水とエネルギーを節約するようにしています"],
    ["Many people go to work by bike", "Mucha gente va al trabajo en bicicleta", "Beaucoup de gens vont au travail à vélo", "Viele Leute fahren mit dem Fahrrad zur Arbeit", "Molte persone vanno al lavoro in bicicletta", "Muita gente vai para o trabalho de bicicleta", "多くの人が自転車で通勤しています"],
    ["The air in the city is polluted", "El aire de la ciudad está contaminado", "L'air de la ville est pollué", "Die Luft in der Stadt ist verschmutzt", "L'aria della città è inquinata", "O ar da cidade está poluído", "市内の空気は汚れています"],
    ["Our community needs more green spaces", "Nuestra comunidad necesita más zonas verdes", "Notre communauté a besoin de plus d'espaces verts", "Unsere Gemeinde braucht mehr Grünflächen", "La nostra comunità ha bisogno di più spazi verdi", "A nossa comunidade precisa de mais espaços verdes", "私たちの地域にはもっと緑地が必要です"],
    ["If we plant trees, the city will be cooler", "Si plantamos árboles, la ciudad será más fresca", "Si nous plantons des arbres, la ville sera plus fraîche", "Wenn wir Bäume pflanzen, wird die Stadt kühler", "Se piantiamo alberi, la città sarà più fresca", "Se plantarmos árvores, a cidade será mais fresca", "木を植えれば、街は涼しくなります"],
    ["I volunteer at a local charity", "Soy voluntario en una organización benéfica local", "Je suis bénévole dans une association locale", "Ich arbeite ehrenamtlich bei einer lokalen Wohltätigkeitsorganisation", "Faccio volontariato in un'associazione locale", "Sou voluntário numa associação local", "地元の慈善団体でボランティアをしています"],
    ["Let's clean the beach this Saturday", "Limpiemos la playa este sábado", "Nettoyons la plage ce samedi", "Lasst uns diesen Samstag den Strand reinigen", "Puliamo la spiaggia questo sabato", "Vamos limpar a praia neste sábado", "今度の土曜日に海岸を掃除しましょう"],
  ],
  // Unit 17 — Health & Lifestyle
  [
    ["You should drink more water", "Debería beber más agua", "Vous devriez boire plus d'eau", "Sie sollten mehr Wasser trinken", "Dovrebbe bere più acqua", "Devia beber mais água", "もっと水を飲んだほうがいいです"],
    ["You ought to get more sleep", "Tendría que dormir más", "Vous devriez dormir davantage", "Sie sollten mehr schlafen", "Dovrebbe dormire di più", "Devia dormir mais", "もっと睡眠をとるべきです"],
    ["I try to eat healthy food", "Intento comer de forma saludable", "J'essaie de manger sainement", "Ich versuche, gesund zu essen", "Cerco di mangiare in modo sano", "Tento comer de forma saudável", "健康的な食事を心がけています"],
    ["Exercise is good for your heart", "El ejercicio es bueno para el corazón", "L'exercice est bon pour le cœur", "Sport ist gut für das Herz", "L'attività fisica fa bene al cuore", "O exercício é bom para o coração", "運動は心臓にいいです"],
    ["I'd advise you to see a doctor", "Le aconsejo que vaya al médico", "Je vous conseille de consulter un médecin", "Ich rate Ihnen, einen Arzt aufzusuchen", "Le consiglio di andare dal medico", "Aconselho-o a ir ao médico", "医者に診てもらうことをお勧めします"],
    ["Try not to skip breakfast", "Intente no saltarse el desayuno", "Essayez de ne pas sauter le petit-déjeuner", "Versuchen Sie, das Frühstück nicht auszulassen", "Cerchi di non saltare la colazione", "Tente não saltar o pequeno-almoço", "朝食を抜かないようにしてください"],
    ["I have been feeling stressed lately", "Últimamente me siento estresado", "Je me sens stressé ces derniers temps", "In letzter Zeit fühle ich mich gestresst", "Ultimamente mi sento stressato", "Ultimamente tenho-me sentido stressado", "最近ストレスを感じています"],
    ["Walking every day makes a difference", "Caminar todos los días marca la diferencia", "Marcher tous les jours fait la différence", "Jeden Tag zu gehen macht einen Unterschied", "Camminare ogni giorno fa la differenza", "Caminhar todos os dias faz a diferença", "毎日歩くと違いが出ます"],
    ["It's important to find a balance", "Es importante encontrar un equilibrio", "Il est important de trouver un équilibre", "Es ist wichtig, ein Gleichgewicht zu finden", "È importante trovare un equilibrio", "É importante encontrar um equilíbrio", "バランスを見つけることが大切です"],
  ],
  // Unit 18 — Culture & Traditions
  [
    ["People used to write letters by hand", "La gente solía escribir cartas a mano", "Autrefois, les gens écrivaient des lettres à la main", "Früher haben die Leute Briefe mit der Hand geschrieben", "Una volta la gente scriveva le lettere a mano", "As pessoas costumavam escrever cartas à mão", "昔は手で手紙を書いていました"],
    ["This festival is celebrated every spring", "Esta fiesta se celebra cada primavera", "Cette fête est célébrée chaque printemps", "Dieses Fest wird jeden Frühling gefeiert", "Questa festa si celebra ogni primavera", "Esta festa é celebrada todas as primaveras", "この祭りは毎年春に行われます"],
    ["I used to live in a small village", "Antes vivía en un pueblo pequeño", "J'habitais autrefois dans un petit village", "Ich habe früher in einem kleinen Dorf gewohnt", "Vivevo in un piccolo paese", "Eu vivia numa pequena aldeia", "以前は小さな村に住んでいました"],
    ["The tradition has been passed down for generations", "La tradición se ha transmitido de generación en generación", "La tradition se transmet depuis des générations", "Die Tradition wird seit Generationen weitergegeben", "La tradizione si tramanda da generazioni", "A tradição passa de geração em geração", "その伝統は何世代にもわたって受け継がれています"],
    ["The cathedral was built in 1850", "La catedral fue construida en 1850", "La cathédrale a été construite en 1850", "Die Kathedrale wurde 1850 gebaut", "La cattedrale fu costruita nel 1850", "A catedral foi construída em 1850", "その大聖堂は一八五〇年に建てられました"],
    ["In my country, people greet with a kiss", "En mi país, la gente saluda con un beso", "Dans mon pays, on se salue avec une bise", "In meinem Land begrüßt man sich mit einem Kuss", "Nel mio paese ci si saluta con un bacio", "No meu país, as pessoas cumprimentam-se com um beijo", "私の国では、キスであいさつします"],
    ["Traditional food is served on holidays", "La comida tradicional se sirve en los días festivos", "La cuisine traditionnelle est servie les jours de fête", "An Feiertagen wird traditionelles Essen serviert", "Nei giorni di festa si serve il cibo tradizionale", "A comida tradicional é servida nos feriados", "祝日には伝統料理が出されます"],
    ["We didn't use to have a television", "Antes no teníamos televisión", "Nous n'avions pas de télévision à l'époque", "Früher hatten wir keinen Fernseher", "Prima non avevamo la televisione", "Antigamente não tínhamos televisão", "昔はテレビがありませんでした"],
    ["Every region has its own customs", "Cada región tiene sus propias costumbres", "Chaque région a ses propres coutumes", "Jede Region hat ihre eigenen Bräuche", "Ogni regione ha le sue usanze", "Cada região tem os seus próprios costumes", "どの地域にも独自の習慣があります"],
  ],
  // Unit 19 — Decisions & Possibilities
  [
    ["If I had more time, I would travel", "Si tuviera más tiempo, viajaría", "Si j'avais plus de temps, je voyagerais", "Wenn ich mehr Zeit hätte, würde ich reisen", "Se avessi più tempo, viaggerei", "Se tivesse mais tempo, viajaria", "もっと時間があれば、旅行します"],
    ["I might change my job next year", "Quizás cambie de trabajo el año que viene", "Je changerai peut-être de travail l'année prochaine", "Vielleicht wechsle ich nächstes Jahr den Job", "Forse l'anno prossimo cambierò lavoro", "Talvez mude de emprego para o ano", "来年、転職するかもしれません"],
    ["What would you do in my place?", "¿Qué haría usted en mi lugar?", "Que feriez-vous à ma place ?", "Was würden Sie an meiner Stelle tun?", "Cosa farebbe al mio posto?", "O que faria no meu lugar?", "私の立場ならどうしますか"],
    ["It could be a good opportunity", "Podría ser una buena oportunidad", "Ce pourrait être une bonne occasion", "Das könnte eine gute Gelegenheit sein", "Potrebbe essere una buona occasione", "Podia ser uma boa oportunidade", "いい機会になるかもしれません"],
    ["I haven't decided yet", "Todavía no he decidido", "Je n'ai pas encore décidé", "Ich habe mich noch nicht entschieden", "Non ho ancora deciso", "Ainda não decidi", "まだ決めていません"],
    ["If I were you, I would wait", "Yo en su lugar, esperaría", "À votre place, j'attendrais", "An Ihrer Stelle würde ich warten", "Al suo posto, aspetterei", "No seu lugar, esperava", "私があなたなら、待ちます"],
    ["Both options have risks", "Ambas opciones tienen riesgos", "Les deux options comportent des risques", "Beide Optionen sind mit Risiken verbunden", "Entrambe le opzioni comportano dei rischi", "Ambas as opções têm riscos", "どちらの選択肢にもリスクがあります"],
    ["We could take a different route", "Podríamos tomar otra ruta", "Nous pourrions prendre un autre itinéraire", "Wir könnten eine andere Route nehmen", "Potremmo prendere un'altra strada", "Podíamos seguir por outro caminho", "別の道を行くこともできます"],
    ["I need some time to think it over", "Necesito un tiempo para pensarlo", "J'ai besoin de temps pour y réfléchir", "Ich brauche etwas Zeit, um darüber nachzudenken", "Ho bisogno di tempo per pensarci", "Preciso de algum tempo para pensar nisso", "考える時間が必要です"],
  ],
  // Unit 20 — Explaining Processes
  [
    ["First, the ingredients are mixed", "Primero, se mezclan los ingredientes", "D'abord, on mélange les ingrédients", "Zuerst werden die Zutaten gemischt", "Prima si mescolano gli ingredienti", "Primeiro, misturam-se os ingredientes", "まず、材料を混ぜます"],
    ["The dough is left to rest for an hour", "La masa se deja reposar una hora", "On laisse reposer la pâte pendant une heure", "Der Teig wird eine Stunde ruhen gelassen", "L'impasto viene lasciato riposare per un'ora", "A massa é deixada a descansar durante uma hora", "生地は一時間寝かせます"],
    ["The files are saved automatically", "Los archivos se guardan automáticamente", "Les fichiers sont enregistrés automatiquement", "Die Dateien werden automatisch gespeichert", "I file vengono salvati automaticamente", "Os ficheiros são guardados automaticamente", "ファイルは自動的に保存されます"],
    ["Once it is finished, press the button", "Cuando termine, pulse el botón", "Une fois terminé, appuyez sur le bouton", "Sobald es fertig ist, drücken Sie den Knopf", "Una volta finito, premete il pulsante", "Quando terminar, prima o botão", "終わったら、ボタンを押してください"],
    ["The parcel will be delivered tomorrow", "El paquete será entregado mañana", "Le colis sera livré demain", "Das Paket wird morgen geliefert", "Il pacco sarà consegnato domani", "A encomenda será entregue amanhã", "荷物は明日届けられます"],
    ["Next, the form must be signed", "A continuación, hay que firmar el formulario", "Ensuite, le formulaire doit être signé", "Als Nächstes muss das Formular unterschrieben werden", "Poi il modulo deve essere firmato", "Em seguida, o formulário tem de ser assinado", "次に、用紙に署名しなければなりません"],
    ["The machine is switched on at eight", "La máquina se enciende a las ocho", "La machine est mise en marche à huit heures", "Die Maschine wird um acht Uhr eingeschaltet", "La macchina viene accesa alle otto", "A máquina é ligada às oito", "機械は八時に電源が入ります"],
    ["After the test, the results are sent by email", "Tras la prueba, los resultados se envían por correo", "Après le test, les résultats sont envoyés par e-mail", "Nach dem Test werden die Ergebnisse per E-Mail geschickt", "Dopo il test, i risultati vengono inviati per e-mail", "Depois do teste, os resultados são enviados por email", "テストの後、結果はメールで送られます"],
    ["Finally, the product is checked and packed", "Por último, el producto se revisa y se embala", "Enfin, le produit est contrôlé et emballé", "Schließlich wird das Produkt geprüft und verpackt", "Infine il prodotto viene controllato e imballato", "Por fim, o produto é verificado e embalado", "最後に、製品を検査して梱包します"],
  ],
  // Unit 21 — Professional Communication
  [
    ["I would be grateful if you could confirm", "Le agradecería que pudiera confirmarlo", "Je vous serais reconnaissant de bien vouloir confirmer", "Ich wäre Ihnen dankbar, wenn Sie das bestätigen könnten", "Le sarei grato se potesse confermare", "Agradecia que pudesse confirmar", "ご確認いただければ幸いです"],
    ["Could you tell me when the report will be ready?", "¿Podría decirme cuándo estará listo el informe?", "Pourriez-vous me dire quand le rapport sera prêt ?", "Könnten Sie mir sagen, wann der Bericht fertig ist?", "Potrebbe dirmi quando sarà pronto il rapporto?", "Poderia dizer-me quando o relatório estará pronto?", "報告書はいつ完成するか教えていただけますか"],
    ["I am writing to follow up on our meeting", "Le escribo para dar seguimiento a nuestra reunión", "Je vous écris pour faire suite à notre réunion", "Ich schreibe Ihnen, um unser Treffen nachzubereiten", "Le scrivo a seguito del nostro incontro", "Escrevo para dar seguimento à nossa reunião", "先日の会議の件でご連絡しました"],
    ["Please find the attached document", "Adjunto encontrará el documento", "Veuillez trouver le document ci-joint", "Anbei finden Sie das Dokument", "In allegato trova il documento", "Segue em anexo o documento", "添付の書類をご確認ください"],
    ["I apologise for the delay in replying", "Le pido disculpas por la demora en responder", "Je vous prie de m'excuser pour ce retard de réponse", "Ich entschuldige mich für die verspätete Antwort", "Mi scuso per il ritardo nella risposta", "Peço desculpa pela demora na resposta", "返信が遅くなり申し訳ありません"],
    ["Do you happen to know who is in charge?", "¿Sabría usted quién está a cargo?", "Savez-vous par hasard qui est responsable ?", "Wissen Sie zufällig, wer zuständig ist?", "Per caso sa chi è il responsabile?", "Por acaso sabe quem é o responsável?", "担当者がどなたかご存じですか"],
    ["We would like to schedule a call next week", "Nos gustaría programar una llamada la semana próxima", "Nous aimerions planifier un appel la semaine prochaine", "Wir würden gern nächste Woche ein Telefonat vereinbaren", "Vorremmo fissare una chiamata la settimana prossima", "Gostaríamos de marcar uma chamada para a próxima semana", "来週、電話会議を設定したいと考えております"],
    ["I look forward to hearing from you", "Quedo a la espera de su respuesta", "Dans l'attente de votre réponse", "Ich freue mich auf Ihre Antwort", "Resto in attesa di una sua risposta", "Aguardo a sua resposta", "ご返信をお待ちしております"],
    ["Please let me know if you need anything else", "No dude en avisarme si necesita algo más", "N'hésitez pas à me dire si vous avez besoin d'autre chose", "Sagen Sie mir bitte Bescheid, falls Sie noch etwas brauchen", "Mi faccia sapere se ha bisogno di altro", "Diga-me se precisar de mais alguma coisa", "ほかに必要なものがあればお知らせください"],
  ],
  // Unit 22 — Negotiation & Compromise
  [
    ["We have to meet the deadline", "Tenemos que cumplir el plazo", "Nous devons respecter le délai", "Wir müssen die Frist einhalten", "Dobbiamo rispettare la scadenza", "Temos de cumprir o prazo", "締め切りを守らなければなりません"],
    ["I'm afraid we can't accept that price", "Me temo que no podemos aceptar ese precio", "Je crains que nous ne puissions pas accepter ce prix", "Leider können wir diesen Preis nicht akzeptieren", "Temo che non possiamo accettare quel prezzo", "Receio que não possamos aceitar esse preço", "申し訳ありませんが、その価格は受け入れられません"],
    ["Let's find a solution that works for both", "Busquemos una solución que sirva a los dos", "Trouvons une solution qui convienne aux deux", "Lassen Sie uns eine Lösung finden, die für beide passt", "Troviamo una soluzione che vada bene a entrambi", "Vamos encontrar uma solução que sirva a ambos", "双方にとって良い解決策を探しましょう"],
    ["We are willing to make a compromise", "Estamos dispuestos a llegar a un acuerdo", "Nous sommes prêts à faire un compromis", "Wir sind bereit, einen Kompromiss einzugehen", "Siamo disposti a scendere a un compromesso", "Estamos dispostos a chegar a um compromisso", "私たちは妥協する用意があります"],
    ["You don't have to decide today", "No tiene que decidirlo hoy", "Vous n'avez pas à décider aujourd'hui", "Sie müssen heute nicht entscheiden", "Non è tenuto a decidere oggi", "Não tem de decidir hoje", "今日決める必要はありません"],
    ["Even so, we should consider the risks", "Aun así, deberíamos considerar los riesgos", "Malgré tout, nous devrions tenir compte des risques", "Trotzdem sollten wir die Risiken bedenken", "Ciò nonostante, dovremmo valutare i rischi", "Mesmo assim, devemos considerar os riscos", "それでも、リスクは考慮すべきです"],
    ["That's my final offer", "Esa es mi última oferta", "C'est ma dernière offre", "Das ist mein letztes Angebot", "Questa è la mia ultima offerta", "Essa é a minha última oferta", "これが最終的なご提案です"],
    ["We can offer a discount for bulk orders", "Podemos ofrecer un descuento por pedidos al por mayor", "Nous pouvons offrir une remise pour les commandes en gros", "Für Großbestellungen können wir einen Rabatt anbieten", "Possiamo offrire uno sconto per ordini all'ingrosso", "Podemos oferecer um desconto para encomendas grandes", "大量注文には割引をご提供できます"],
    ["Let's put the agreement in writing", "Pongamos el acuerdo por escrito", "Mettons l'accord par écrit", "Halten wir die Vereinbarung schriftlich fest", "Mettiamo l'accordo per iscritto", "Vamos pôr o acordo por escrito", "合意内容を書面にしましょう"],
  ],
  // Unit 23 — News & Current Affairs
  [
    ["The minister said that taxes would rise", "El ministro dijo que los impuestos subirían", "Le ministre a déclaré que les impôts augmenteraient", "Der Minister sagte, dass die Steuern steigen würden", "Il ministro ha detto che le tasse sarebbero aumentate", "O ministro disse que os impostos iam subir", "大臣は増税になると述べました"],
    ["According to the report, prices are falling", "Según el informe, los precios están bajando", "Selon le rapport, les prix baissent", "Laut dem Bericht sinken die Preise", "Secondo il rapporto, i prezzi stanno calando", "Segundo o relatório, os preços estão a descer", "報告書によると、物価は下がっています"],
    ["Thousands of people were evacuated", "Miles de personas fueron evacuadas", "Des milliers de personnes ont été évacuées", "Tausende Menschen wurden evakuiert", "Migliaia di persone sono state evacuate", "Milhares de pessoas foram evacuadas", "何千人もの人が避難しました"],
    ["The police are investigating the incident", "La policía está investigando el incidente", "La police enquête sur l'incident", "Die Polizei untersucht den Vorfall", "La polizia sta indagando sull'incidente", "A polícia está a investigar o incidente", "警察はその事件を捜査しています"],
    ["He claimed that he had never been there", "Afirmó que nunca había estado allí", "Il a affirmé qu'il n'y avait jamais été", "Er behauptete, nie dort gewesen zu sein", "Ha affermato di non esserci mai stato", "Afirmou que nunca tinha estado lá", "彼はそこに行ったことがないと主張しました"],
    ["The election results will be announced tonight", "Los resultados electorales se anunciarán esta noche", "Les résultats des élections seront annoncés ce soir", "Die Wahlergebnisse werden heute Abend bekannt gegeben", "I risultati delle elezioni saranno annunciati stasera", "Os resultados eleitorais serão anunciados esta noite", "選挙結果は今夜発表されます"],
    ["Experts warn that the situation could worsen", "Los expertos advierten de que la situación podría empeorar", "Les experts avertissent que la situation pourrait empirer", "Experten warnen, dass sich die Lage verschlechtern könnte", "Gli esperti avvertono che la situazione potrebbe peggiorare", "Os peritos avisam que a situação pode piorar", "専門家は状況が悪化する可能性があると警告しています"],
    ["The new law was approved by parliament", "La nueva ley fue aprobada por el parlamento", "La nouvelle loi a été adoptée par le parlement", "Das neue Gesetz wurde vom Parlament verabschiedet", "La nuova legge è stata approvata dal parlamento", "A nova lei foi aprovada pelo parlamento", "新しい法律は議会で可決されました"],
    ["It was reported that the company would close", "Se informó de que la empresa cerraría", "On a rapporté que l'entreprise fermerait", "Es wurde berichtet, dass das Unternehmen schließen würde", "Si è saputo che l'azienda avrebbe chiuso", "Foi noticiado que a empresa iria encerrar", "その会社が閉鎖されると報じられました"],
  ],
  // Unit 24 — Debate & Persuasion
  [
    ["It seems to me that you are right", "Me parece que tiene razón", "Il me semble que vous avez raison", "Mir scheint, dass Sie recht haben", "Mi sembra che abbia ragione", "Parece-me que tem razão", "あなたの言うとおりだと思います"],
    ["On the other hand, it is very expensive", "Por otro lado, es muy caro", "D'un autre côté, c'est très cher", "Andererseits ist es sehr teuer", "D'altra parte, è molto costoso", "Por outro lado, é muito caro", "一方で、とても高価です"],
    ["That may be true, but I disagree", "Puede que sea cierto, pero no estoy de acuerdo", "C'est peut-être vrai, mais je ne suis pas d'accord", "Das mag stimmen, aber ich sehe das anders", "Può essere vero, ma non sono d'accordo", "Pode ser verdade, mas não concordo", "そうかもしれませんが、私は賛成できません"],
    ["Whereas some people prefer cities, others love the countryside", "Mientras que algunos prefieren las ciudades, otros adoran el campo", "Alors que certains préfèrent les villes, d'autres adorent la campagne", "Während manche Städte bevorzugen, lieben andere das Land", "Mentre alcuni preferiscono le città, altri amano la campagna", "Enquanto alguns preferem as cidades, outros adoram o campo", "都会を好む人もいれば、田舎が好きな人もいます"],
    ["I am not entirely convinced", "No estoy del todo convencido", "Je ne suis pas tout à fait convaincu", "Ich bin nicht ganz überzeugt", "Non sono del tutto convinto", "Não estou totalmente convencido", "完全には納得できません"],
    ["Let me put it another way", "Permítame decirlo de otra manera", "Permettez-moi de le formuler autrement", "Lassen Sie es mich anders ausdrücken", "Mi permetta di dirlo in un altro modo", "Deixe-me dizer de outra forma", "言い方を変えさせてください"],
    ["Despite the cost, it is worth it", "A pesar del coste, merece la pena", "Malgré le coût, cela en vaut la peine", "Trotz der Kosten lohnt es sich", "Nonostante il costo, ne vale la pena", "Apesar do custo, vale a pena", "費用はかかりますが、それだけの価値があります"],
    ["I see your point, but consider this", "Entiendo su punto de vista, pero considere esto", "Je comprends votre point de vue, mais réfléchissez à ceci", "Ich verstehe Ihren Standpunkt, aber bedenken Sie Folgendes", "Capisco il suo punto di vista, ma consideri questo", "Compreendo o seu ponto de vista, mas considere isto", "お考えは分かりますが、これも考えてみてください"],
    ["The evidence strongly suggests otherwise", "Las pruebas sugieren claramente lo contrario", "Les preuves suggèrent clairement le contraire", "Die Beweise deuten klar auf das Gegenteil hin", "Le prove suggeriscono chiaramente il contrario", "As provas sugerem claramente o contrário", "証拠はまったく逆のことを示唆しています"],
  ],
  // Unit 25 — Science & Innovation
  [
    ["The scientist who discovered the cure won a prize", "El científico que descubrió la cura ganó un premio", "Le scientifique qui a découvert le remède a reçu un prix", "Der Wissenschaftler, der das Heilmittel entdeckt hat, erhielt einen Preis", "Lo scienziato che ha scoperto la cura ha vinto un premio", "O cientista que descobriu a cura ganhou um prémio", "治療法を発見した科学者が賞を受賞しました"],
    ["Artificial intelligence is changing our daily lives", "La inteligencia artificial está cambiando nuestra vida diaria", "L'intelligence artificielle change notre quotidien", "Künstliche Intelligenz verändert unseren Alltag", "L'intelligenza artificiale sta cambiando la nostra vita quotidiana", "A inteligência artificial está a mudar o nosso dia a dia", "人工知能は私たちの日常を変えています"],
    ["The experiment, which lasted a year, was a success", "El experimento, que duró un año, fue un éxito", "L'expérience, qui a duré un an, a été un succès", "Das Experiment, das ein Jahr dauerte, war ein Erfolg", "L'esperimento, durato un anno, è stato un successo", "A experiência, que durou um ano, foi um sucesso", "一年続いた実験は成功しました"],
    ["Renewable energy sources are becoming cheaper", "Las fuentes de energía renovable son cada vez más baratas", "Les sources d'énergie renouvelable deviennent moins chères", "Erneuerbare Energiequellen werden immer billiger", "Le fonti di energia rinnovabile stanno diventando più economiche", "As fontes de energia renovável estão a ficar mais baratas", "再生可能エネルギーはますます安くなっています"],
    ["This technology was developed by a small team", "Esta tecnología fue desarrollada por un equipo pequeño", "Cette technologie a été développée par une petite équipe", "Diese Technologie wurde von einem kleinen Team entwickelt", "Questa tecnologia è stata sviluppata da un piccolo team", "Esta tecnologia foi desenvolvida por uma pequena equipa", "この技術は小さなチームによって開発されました"],
    ["The results need to be independently verified", "Los resultados deben ser verificados de forma independiente", "Les résultats doivent être vérifiés de manière indépendante", "Die Ergebnisse müssen unabhängig überprüft werden", "I risultati devono essere verificati in modo indipendente", "Os resultados têm de ser verificados de forma independente", "結果は独立して検証される必要があります"],
    ["The device that you are holding is a prototype", "El dispositivo que tiene en la mano es un prototipo", "L'appareil que vous tenez est un prototype", "Das Gerät, das Sie in der Hand halten, ist ein Prototyp", "Il dispositivo che ha in mano è un prototipo", "O dispositivo que tem na mão é um protótipo", "お持ちの装置は試作品です"],
    ["Researchers are working on a vaccine against the virus", "Los investigadores trabajan en una vacuna contra el virus", "Des chercheurs travaillent sur un vaccin contre le virus", "Forscher arbeiten an einem Impfstoff gegen das Virus", "I ricercatori lavorano a un vaccino contro il virus", "Os investigadores estão a trabalhar numa vacina contra o vírus", "研究者たちはそのウイルスのワクチンに取り組んでいます"],
    ["Innovation requires both creativity and patience", "La innovación requiere tanto creatividad como paciencia", "L'innovation exige à la fois créativité et patience", "Innovation erfordert sowohl Kreativität als auch Geduld", "L'innovazione richiede sia creatività sia pazienza", "A inovação exige tanto criatividade como paciência", "革新には創造力と忍耐の両方が必要です"],
  ],
  // Unit 26 — Society & Ethics
  [
    ["If we had acted sooner, the problem would be smaller", "Si hubiéramos actuado antes, el problema sería menor", "Si nous avions agi plus tôt, le problème serait moins grave", "Wenn wir früher gehandelt hätten, wäre das Problem kleiner", "Se avessimo agito prima, il problema sarebbe più piccolo", "Se tivéssemos agido mais cedo, o problema seria menor", "もっと早く行動していれば、問題は小さかったでしょう"],
    ["Everyone deserves equal opportunities", "Todos merecen las mismas oportunidades", "Chacun mérite les mêmes chances", "Jeder verdient die gleichen Chancen", "Tutti meritano le stesse opportunità", "Todos merecem as mesmas oportunidades", "誰もが平等な機会を受けるに値します"],
    ["It is a matter of fairness, not charity", "Es una cuestión de justicia, no de caridad", "C'est une question d'équité, pas de charité", "Es ist eine Frage der Gerechtigkeit, nicht der Wohltätigkeit", "È una questione di equità, non di carità", "É uma questão de justiça, não de caridade", "これは慈善ではなく公平さの問題です"],
    ["Technology raises serious ethical questions", "La tecnología plantea serias cuestiones éticas", "La technologie soulève de sérieuses questions éthiques", "Technologie wirft ernste ethische Fragen auf", "La tecnologia solleva seri interrogativi etici", "A tecnologia levanta sérias questões éticas", "テクノロジーは重大な倫理的問題を提起します"],
    ["Had I known, I would have said something", "De haberlo sabido, habría dicho algo", "Si je l'avais su, j'aurais dit quelque chose", "Hätte ich es gewusst, hätte ich etwas gesagt", "Se lo avessi saputo, avrei detto qualcosa", "Se o soubesse, teria dito alguma coisa", "知っていたら、何か言っていたでしょう"],
    ["We must protect the most vulnerable members of society", "Debemos proteger a los miembros más vulnerables de la sociedad", "Nous devons protéger les membres les plus vulnérables de la société", "Wir müssen die schwächsten Mitglieder der Gesellschaft schützen", "Dobbiamo proteggere i membri più vulnerabili della società", "Devemos proteger os membros mais vulneráveis da sociedade", "社会で最も弱い立場の人々を守らなければなりません"],
    ["The issue is more complicated than it seems", "El asunto es más complicado de lo que parece", "La question est plus compliquée qu'elle n'en a l'air", "Die Sache ist komplizierter, als sie scheint", "La questione è più complicata di quanto sembri", "O assunto é mais complicado do que parece", "この問題は見た目よりも複雑です"],
    ["Privacy should not be sacrificed for convenience", "La privacidad no debería sacrificarse por comodidad", "La vie privée ne devrait pas être sacrifiée à la commodité", "Datenschutz sollte nicht der Bequemlichkeit geopfert werden", "La privacy non dovrebbe essere sacrificata alla comodità", "A privacidade não deve ser sacrificada pela conveniência", "利便性のためにプライバシーを犠牲にすべきではありません"],
    ["Responsibility lies with all of us", "La responsabilidad recae en todos nosotros", "La responsabilité nous incombe à tous", "Die Verantwortung liegt bei uns allen", "La responsabilità è di tutti noi", "A responsabilidade cabe a todos nós", "責任は私たち全員にあります"],
  ],
  // Unit 27 — Leadership & Strategy
  [
    ["Never have I seen such dedication", "Nunca había visto tanta dedicación", "Jamais je n'avais vu un tel dévouement", "Noch nie habe ich so viel Hingabe gesehen", "Non avevo mai visto tanta dedizione", "Nunca tinha visto tanta dedicação", "これほどの熱意は見たことがありません"],
    ["It was the team that made the difference", "Fue el equipo el que marcó la diferencia", "C'est l'équipe qui a fait la différence", "Es war das Team, das den Unterschied gemacht hat", "È stata la squadra a fare la differenza", "Foi a equipa que fez a diferença", "違いを生んだのはチームでした"],
    ["Only by working together can we succeed", "Solo trabajando juntos podremos tener éxito", "Ce n'est qu'en travaillant ensemble que nous réussirons", "Nur wenn wir zusammenarbeiten, können wir Erfolg haben", "Solo lavorando insieme potremo riuscire", "Só trabalhando juntos poderemos ter sucesso", "協力してこそ成功できます"],
    ["A good leader listens before deciding", "Un buen líder escucha antes de decidir", "Un bon dirigeant écoute avant de décider", "Eine gute Führungskraft hört zu, bevor sie entscheidet", "Un buon leader ascolta prima di decidere", "Um bom líder ouve antes de decidir", "良いリーダーは決める前に耳を傾けます"],
    ["What matters most is long-term vision", "Lo que más importa es la visión a largo plazo", "Ce qui compte le plus, c'est la vision à long terme", "Am wichtigsten ist die langfristige Vision", "Ciò che conta di più è la visione a lungo termine", "O que mais importa é a visão a longo prazo", "最も大切なのは長期的なビジョンです"],
    ["Rarely do we get a second chance", "Rara vez tenemos una segunda oportunidad", "Rares sont les occasions où l'on a une seconde chance", "Selten bekommen wir eine zweite Chance", "Raramente abbiamo una seconda possibilità", "Raramente temos uma segunda oportunidade", "二度目のチャンスはめったにありません"],
    ["We need to prioritise our objectives", "Necesitamos priorizar nuestros objetivos", "Nous devons hiérarchiser nos objectifs", "Wir müssen unsere Ziele priorisieren", "Dobbiamo dare priorità ai nostri obiettivi", "Precisamos de dar prioridade aos nossos objetivos", "目標の優先順位をつける必要があります"],
    ["It is up to us to set the direction", "Nos corresponde a nosotros marcar el rumbo", "C'est à nous de fixer la direction", "Es liegt an uns, die Richtung vorzugeben", "Spetta a noi stabilire la direzione", "Cabe-nos a nós definir o rumo", "方向性を決めるのは私たちです"],
    ["Not only did we meet our targets, we exceeded them", "No solo cumplimos los objetivos, sino que los superamos", "Non seulement nous avons atteint nos objectifs, mais nous les avons dépassés", "Wir haben unsere Ziele nicht nur erreicht, sondern übertroffen", "Non solo abbiamo raggiunto gli obiettivi, li abbiamo superati", "Não só cumprimos as metas, como as superámos", "目標を達成しただけでなく、上回りました"],
  ],
  // Unit 28 — Literature & Interpretation
  [
    ["I suggest that he read the book", "Sugiero que lea el libro", "Je suggère qu'il lise le livre", "Ich schlage vor, dass er das Buch liest", "Suggerisco che legga il libro", "Sugiro que ele leia o livro", "彼にその本を読むことを勧めます"],
    ["The author may have wanted to shock the reader", "Puede que el autor quisiera sorprender al lector", "L'auteur a peut-être voulu choquer le lecteur", "Der Autor wollte den Leser möglicherweise schockieren", "L'autore potrebbe aver voluto scioccare il lettore", "O autor pode ter querido chocar o leitor", "作者は読者を驚かせたかったのかもしれません"],
    ["The novel explores themes of loss and memory", "La novela explora los temas de la pérdida y la memoria", "Le roman explore les thèmes de la perte et de la mémoire", "Der Roman behandelt die Themen Verlust und Erinnerung", "Il romanzo esplora i temi della perdita e della memoria", "O romance explora os temas da perda e da memória", "その小説は喪失と記憶というテーマを扱っています"],
    ["It is essential that everyone be present", "Es fundamental que todos estén presentes", "Il est essentiel que tout le monde soit présent", "Es ist wesentlich, dass alle anwesend sind", "È essenziale che tutti siano presenti", "É essencial que todos estejam presentes", "全員が出席することが不可欠です"],
    ["The poem can be read in several ways", "El poema puede leerse de varias maneras", "Le poème peut se lire de plusieurs façons", "Das Gedicht lässt sich auf verschiedene Weise lesen", "La poesia si può leggere in diversi modi", "O poema pode ser lido de várias maneiras", "その詩はいくつかの読み方ができます"],
    ["The ending leaves room for interpretation", "El final deja espacio para la interpretación", "La fin laisse place à l'interprétation", "Das Ende lässt Raum für Interpretation", "Il finale lascia spazio all'interpretazione", "O final deixa espaço para interpretação", "結末は解釈の余地を残しています"],
    ["I wish the story were longer", "Ojalá la historia fuera más larga", "J'aimerais que l'histoire soit plus longue", "Ich wünschte, die Geschichte wäre länger", "Vorrei che la storia fosse più lunga", "Gostava que a história fosse mais longa", "物語がもっと長ければいいのにと思います"],
    ["The main character undergoes a profound change", "El protagonista experimenta un cambio profundo", "Le personnage principal subit une profonde transformation", "Die Hauptfigur durchläuft eine tiefgreifende Veränderung", "Il protagonista subisce un profondo cambiamento", "A personagem principal sofre uma mudança profunda", "主人公は大きな変化を遂げます"],
    ["Critics have praised the writer's style", "La crítica ha elogiado el estilo del escritor", "Les critiques ont salué le style de l'écrivain", "Die Kritiker haben den Stil des Schriftstellers gelobt", "I critici hanno elogiato lo stile dello scrittore", "A crítica elogiou o estilo do escritor", "批評家たちは作家の文体を高く評価しました"],
  ],
  // Unit 29 — Complex Social Situations
  [
    ["Don't take it personally", "No se lo tome como algo personal", "Ne le prenez pas personnellement", "Nehmen Sie es nicht persönlich", "Non la prenda sul personale", "Não leve isso a peito", "個人的に受け取らないでください"],
    ["It's not the end of the world", "No es el fin del mundo", "Ce n'est pas la fin du monde", "Das ist nicht das Ende der Welt", "Non è la fine del mondo", "Não é o fim do mundo", "世界の終わりではありません"],
    ["I'd rather not say, if you don't mind", "Preferiría no decirlo, si no le importa", "Je préférerais ne pas le dire, si cela ne vous dérange pas", "Ich möchte lieber nichts dazu sagen, wenn es Ihnen recht ist", "Preferirei non dirlo, se non le dispiace", "Preferia não dizer, se não se importar", "差し支えなければ、言わないでおきたいです"],
    ["Let's break the ice with a joke", "Rompamos el hielo con un chiste", "Brisons la glace avec une blague", "Brechen wir das Eis mit einem Witz", "Rompiamo il ghiaccio con una battuta", "Vamos quebrar o gelo com uma piada", "冗談で場を和ませましょう"],
    ["He always speaks his mind", "Siempre dice lo que piensa", "Il dit toujours ce qu'il pense", "Er sagt immer, was er denkt", "Dice sempre quello che pensa", "Ele diz sempre o que pensa", "彼はいつも思ったことをはっきり言います"],
    ["That went over my head", "Eso se me escapó por completo", "Cela m'a complètement échappé", "Das ist mir völlig entgangen", "Mi è sfuggito completamente", "Isso passou-me completamente ao lado", "それはまったく理解できませんでした"],
    ["To be honest, I wasn't impressed", "Para ser sincero, no me impresionó", "Pour être honnête, ça ne m'a pas impressionné", "Ehrlich gesagt war ich nicht beeindruckt", "A dire il vero, non mi ha impressionato", "Para ser sincero, não fiquei impressionado", "正直なところ、感心しませんでした"],
    ["We should keep in touch", "Deberíamos mantenernos en contacto", "Nous devrions rester en contact", "Wir sollten in Kontakt bleiben", "Dovremmo restare in contatto", "Devíamos manter o contacto", "連絡を取り合いましょう"],
    ["It was a pleasure to have you here", "Ha sido un placer tenerle aquí", "Ce fut un plaisir de vous avoir ici", "Es war eine Freude, Sie hier zu haben", "È stato un piacere averla qui", "Foi um prazer tê-lo aqui", "お越しいただき光栄でした"],
  ],
  // Unit 30 — Fluent Expression & Synthesis
  [
    ["As a matter of fact, I disagree", "De hecho, no estoy de acuerdo", "En fait, je ne suis pas d'accord", "Tatsächlich sehe ich das anders", "In realtà non sono d'accordo", "Na verdade, não concordo", "実のところ、私は反対です"],
    ["To sum up, we have three main priorities", "En resumen, tenemos tres prioridades principales", "En résumé, nous avons trois priorités principales", "Zusammenfassend haben wir drei Hauptprioritäten", "In sintesi, abbiamo tre priorità principali", "Em resumo, temos três prioridades principais", "要約すると、主な優先事項は三つです"],
    ["On the whole, the project went well", "En general, el proyecto fue bien", "Dans l'ensemble, le projet s'est bien passé", "Im Großen und Ganzen ist das Projekt gut gelaufen", "Nel complesso, il progetto è andato bene", "No geral, o projeto correu bem", "全体として、プロジェクトはうまくいきました"],
    ["Having said that, there are some concerns", "Dicho esto, hay algunas preocupaciones", "Cela dit, il y a quelques préoccupations", "Das gesagt, gibt es einige Bedenken", "Detto questo, ci sono alcune preoccupazioni", "Dito isto, há algumas preocupações", "とはいえ、いくつか懸念もあります"],
    ["By and large, people are satisfied", "En términos generales, la gente está satisfecha", "En gros, les gens sont satisfaits", "Im Allgemeinen sind die Leute zufrieden", "Per lo più, la gente è soddisfatta", "De modo geral, as pessoas estão satisfeitas", "概して、人々は満足しています"],
    ["Not only is it fast, but it is also reliable", "No solo es rápido, sino también fiable", "Non seulement c'est rapide, mais c'est aussi fiable", "Es ist nicht nur schnell, sondern auch zuverlässig", "Non solo è veloce, ma è anche affidabile", "Não só é rápido, como também é fiável", "速いだけでなく、信頼性も高いです"],
    ["In the long run, it will pay off", "A la larga, valdrá la pena", "À long terme, cela portera ses fruits", "Auf lange Sicht wird es sich auszahlen", "Alla lunga, ripagherà", "A longo prazo, vai compensar", "長い目で見れば、報われるでしょう"],
    ["What I mean is that we need to adapt", "Lo que quiero decir es que tenemos que adaptarnos", "Ce que je veux dire, c'est que nous devons nous adapter", "Ich meine damit, dass wir uns anpassen müssen", "Voglio dire che dobbiamo adattarci", "Quero dizer que temos de nos adaptar", "つまり、私たちは適応する必要があるということです"],
    ["Taking everything into account, I accept the offer", "Teniendo todo en cuenta, acepto la oferta", "Tout bien considéré, j'accepte l'offre", "Alles in allem nehme ich das Angebot an", "Tutto considerato, accetto l'offerta", "Tendo tudo em conta, aceito a oferta", "すべてを考慮して、そのご提案を受けます"],
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

/** Number of units that have hand-authored phrases in DATA. Later units rely on generated/adaptive practice. */
export const AUTHORED_UNIT_COUNT = DATA.length;

export const unitConcepts = (unit: number) => CONCEPTS.filter((c) => c.unit === unit);
export const nodeConcepts = (unit: number, node: number) => CONCEPTS.filter((c) => c.unit === unit && c.node === node);
