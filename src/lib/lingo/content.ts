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

// 16 authored units x 9 concepts (units 11+ use adaptive/generated practice). Every concept is used in exactly ONE unit/lesson, so no
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
