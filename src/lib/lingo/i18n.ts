import type { NativeLang, TargetLang } from "./content";

// Column order for every entry below: en, es, fr, de, it, pt
export const UI_ORDER: NativeLang[] = ["en", "es", "fr", "de", "it", "pt"];

export const S = {
  // tabs
  learn: ["Learn Path", "Ruta", "Parcours", "Lernpfad", "Percorso", "Percurso"],
  arena: ["Speech Arena", "Arena de voz", "Arène vocale", "Sprech-Arena", "Arena vocale", "Arena de voz"],
  grammar: ["Grammar Battle", "Batalla gramatical", "Bataille de grammaire", "Grammatik-Kampf", "Battaglia grammaticale", "Batalha gramatical"],
  chat: ["Free Chat", "Charla libre", "Chat libre", "Freies Gespräch", "Chat libera", "Conversa livre"],
  stats: ["Progress", "Progreso", "Progrès", "Fortschritt", "Progressi", "Progresso"],
  // settings
  settings: ["Settings", "Ajustes", "Réglages", "Einstellungen", "Impostazioni", "Definições"],
  welcome: ["Welcome to LingoArena!", "¡Bienvenido a LingoArena!", "Bienvenue sur LingoArena !", "Willkommen bei LingoArena!", "Benvenuto su LingoArena!", "Bem-vindo ao LingoArena!"],
  setupSub: ["Set up your arena. Everything is saved on this device.", "Configura tu arena. Todo se guarda en este dispositivo.", "Configurez votre arène. Tout est enregistré sur cet appareil.", "Richte deine Arena ein. Alles wird auf diesem Gerät gespeichert.", "Configura la tua arena. Tutto viene salvato su questo dispositivo.", "Configure a sua arena. Tudo fica guardado neste dispositivo."],
  iSpeak: ["I speak", "Yo hablo", "Je parle", "Ich spreche", "Parlo", "Eu falo"],
  iLearn: ["I want to learn", "Quiero aprender", "Je veux apprendre", "Ich möchte lernen", "Voglio imparare", "Quero aprender"],
  persona: ["Practice persona", "Personaje de práctica", "Personnage d'entraînement", "Übungs-Figur", "Personaggio di pratica", "Personagem de prática"],
  dark: ["Dark mode", "Modo oscuro", "Mode sombre", "Dunkelmodus", "Modalità scura", "Modo escuro"],
  save: ["Save", "Guardar", "Enregistrer", "Speichern", "Salva", "Guardar"],
  enter: ["Enter the Arena", "Entrar a la Arena", "Entrer dans l'arène", "Arena betreten", "Entra nell'Arena", "Entrar na Arena"],
  resetAll: ["Reset all data", "Borrar todos los datos", "Réinitialiser les données", "Alle Daten löschen", "Cancella tutti i dati", "Apagar todos os dados"],
  wipe: ["Yes, wipe it", "Sí, borrar", "Oui, effacer", "Ja, löschen", "Sì, cancella", "Sim, apagar"],
  cancel: ["Cancel", "Cancelar", "Annuler", "Abbrechen", "Annulla", "Cancelar"],
  close: ["Close", "Cerrar", "Fermer", "Schließen", "Chiudi", "Fechar"],
  nativeLang: ["My language", "Mi idioma", "Ma langue", "Meine Sprache", "La mia lingua", "A minha língua"],
  targetLang: ["Language to learn", "Idioma a aprender", "Langue à apprendre", "Zielsprache", "Lingua da imparare", "Língua a aprender"],
  // persona
  p_barista: ["The Sarcastic Barista", "El barista sarcástico", "Le barista sarcastique", "Der sarkastische Barista", "Il barista sarcastico", "O barista sarcástico"],
  p_barista_b: ["Demands precision when you order.", "Exige precisión al pedir.", "Exige de la précision.", "Verlangt Präzision.", "Pretende precisione.", "Exige precisão."],
  p_gatekeeper: ["The Strict Gatekeeper", "El guardián estricto", "Le gardien strict", "Der strenge Torwächter", "Il guardiano severo", "O guarda rigoroso"],
  p_gatekeeper_b: ["No passage until grammar is perfect.", "No pasas hasta que la gramática sea perfecta.", "Pas de passage sans grammaire parfaite.", "Kein Durchlass ohne perfekte Grammatik.", "Non si passa senza grammatica perfetta.", "Sem passagem até a gramática ser perfeita."],
  p_guide: ["The Energetic Tour Guide", "El guía enérgico", "Le guide énergique", "Der energische Reiseführer", "La guida energica", "O guia enérgico"],
  p_guide_b: ["Rapid-fire travel & directions.", "Viajes e indicaciones a toda velocidad.", "Voyages et directions à toute vitesse.", "Reisen & Wege im Schnellfeuer.", "Viaggi e indicazioni a raffica.", "Viagens e direções a toda a velocidade."],
  // learn path
  unit: ["Unit", "Unidad", "Unité", "Einheit", "Unità", "Unidade"],
  lesson: ["Lesson", "Lección", "Leçon", "Lektion", "Lezione", "Lição"],
  start: ["Start", "Empezar", "Commencer", "Start", "Inizia", "Começar"],
  howSay: ["How do you say…", "¿Cómo se dice…?", "Comment dit-on…", "Wie sagt man…", "Come si dice…", "Como se diz…"],
  whatMean: ["What does this mean?", "¿Qué significa esto?", "Que signifie ceci ?", "Was bedeutet das?", "Cosa significa?", "O que significa?"],
  cont: ["Continue", "Continuar", "Continuer", "Weiter", "Continua", "Continuar"],
  finish: ["Finish", "Terminar", "Terminer", "Fertig", "Fine", "Concluir"],
  nailed: ["Nailed it! +5 XP", "¡Perfecto! +5 XP", "Parfait ! +5 XP", "Super! +5 XP", "Perfetto! +5 XP", "Perfeito! +5 XP"],
  correctIs: ["Correct answer", "Respuesta correcta", "Bonne réponse", "Richtige Antwort", "Risposta corretta", "Resposta certa"],
  exit: ["Exit lesson", "Salir de la lección", "Quitter la leçon", "Lektion beenden", "Esci dalla lezione", "Sair da lição"],
  done: ["Done", "Hecho", "Fait", "Erledigt", "Fatto", "Feito"],
  // speech arena
  pronDuel: ["Pronunciation Duel", "Duelo de pronunciación", "Duel de prononciation", "Aussprache-Duell", "Duello di pronuncia", "Duelo de pronúncia"],
  rapid: ["Rapid Fire", "Fuego rápido", "Tir rapide", "Schnellfeuer", "Fuoco rapido", "Fogo rápido"],
  sayIn: ["Say this in {lang}", "Di esto en {lang}", "Dites ceci en {lang}", "Sag das auf {lang}", "Dillo in {lang}", "Diz isto em {lang}"],
  tapSpeak: ["Tap to speak, tap again to stop", "Toca para hablar, toca otra vez para parar", "Touchez pour parler, touchez pour arrêter", "Tippen zum Sprechen, nochmal zum Stoppen", "Tocca per parlare, tocca per fermare", "Toca para falar, toca outra vez para parar"],
  listening: ["Listening…", "Escuchando…", "J'écoute…", "Ich höre zu…", "Ascolto…", "A ouvir…"],
  noVoice: ["Voice not supported here — type instead", "Voz no compatible aquí — escribe", "Voix non prise en charge — écrivez", "Sprache nicht unterstützt — tippe", "Voce non supportata — scrivi", "Voz não suportada — escreve"],
  youSaid: ["You said", "Dijiste", "Vous avez dit", "Du hast gesagt", "Hai detto", "Disseste"],
  accuracy: ["accuracy", "de precisión", "de précision", "Genauigkeit", "di precisione", "de precisão"],
  iterate: ["Speak again", "Hablar otra vez", "Reparler", "Nochmal sprechen", "Parla ancora", "Falar outra vez"],
  next: ["Next", "Siguiente", "Suivant", "Weiter", "Avanti", "Seguinte"],
  check: ["Check", "Comprobar", "Vérifier", "Prüfen", "Verifica", "Verificar"],
  typeWhatSay: ["Type what you'd say…", "Escribe lo que dirías…", "Écrivez ce que vous diriez…", "Schreibe, was du sagen würdest…", "Scrivi cosa diresti…", "Escreve o que dirias…"],
  good: ["Correct! 🎉", "¡Correcto! 🎉", "Correct ! 🎉", "Richtig! 🎉", "Corretto! 🎉", "Certo! 🎉"],
  bad: ["Not quite — check the red words", "Casi — revisa las palabras en rojo", "Pas tout à fait — voyez les mots en rouge", "Nicht ganz — siehe die roten Wörter", "Quasi — guarda le parole in rosso", "Quase — vê as palavras a vermelho"],
  micBlocked: ["Microphone blocked. Allow it in your browser, or type below.", "Micrófono bloqueado. Permítelo en el navegador o escribe abajo.", "Micro bloqué. Autorisez-le dans le navigateur ou écrivez ci-dessous.", "Mikrofon blockiert. Erlaube ihn im Browser oder tippe unten.", "Microfono bloccato. Consentilo nel browser o scrivi sotto.", "Microfone bloqueado. Permite-o no navegador ou escreve abaixo."],
  noSpeech: ["Didn't catch that — try again.", "No te oí — inténtalo otra vez.", "Je n'ai pas compris — réessayez.", "Nicht verstanden — versuche es noch einmal.", "Non ho capito — riprova.", "Não percebi — tenta outra vez."],
  speechErr: ["Speech error. You can type instead.", "Error de voz. Puedes escribir.", "Erreur vocale. Vous pouvez écrire.", "Sprachfehler. Du kannst tippen.", "Errore vocale. Puoi scrivere.", "Erro de voz. Podes escrever."],
  listenSlow: ["Listen slowly", "Escuchar despacio", "Écouter lentement", "Langsam anhören", "Ascolta lentamente", "Ouvir devagar"],
  listenBtn: ["Listen", "Escuchar", "Écouter", "Anhören", "Ascolta", "Ouvir"],
  // listening modes (grammar + rapid)
  grammarTitle: ["Grammar Boss Battle", "Batalla gramatical", "Bataille de grammaire", "Grammatik-Bosskampf", "Battaglia grammaticale", "Batalha gramatical"],
  listenWrite: ["Listen to the bot and write exactly what it says", "Escucha al bot y escribe exactamente lo que dice", "Écoutez le robot et écrivez exactement ce qu'il dit", "Höre den Bot und schreibe genau, was er sagt", "Ascolta il bot e scrivi esattamente ciò che dice", "Ouve o bot e escreve exatamente o que ele diz"],
  showText: ["Show text (less XP)", "Mostrar texto (menos XP)", "Afficher le texte (moins d'XP)", "Text zeigen (weniger XP)", "Mostra testo (meno XP)", "Mostrar texto (menos XP)"],
  hideText: ["Hide text", "Ocultar texto", "Masquer le texte", "Text verbergen", "Nascondi testo", "Ocultar texto"],
  replay: ["Replay", "Repetir", "Réécouter", "Wiederholen", "Riascolta", "Repetir"],
  submit: ["Submit", "Enviar", "Envoyer", "Senden", "Invia", "Enviar"],
  resubmit: ["Resubmit", "Reenviar", "Renvoyer", "Erneut senden", "Reinvia", "Reenviar"],
  retry: ["Fix it and resubmit — you have 1 free retry!", "Corrígelo y reenvía: ¡tienes 1 intento gratis!", "Corrigez et renvoyez : 1 essai gratuit !", "Korrigiere und sende erneut — 1 Gratisversuch!", "Correggi e reinvia: hai 1 tentativo gratis!", "Corrige e envia outra vez: tens 1 tentativa grátis!"],
  missing: ["Missing", "Faltan", "Manquant", "Fehlt", "Mancano", "Faltam"],
  extra: ["Unexpected", "Sobran", "En trop", "Zu viel", "In più", "A mais"],
  flawless: ["Flawless! +15 XP", "¡Impecable! +15 XP", "Impeccable ! +15 XP", "Fehlerfrei! +15 XP", "Impeccabile! +15 XP", "Impecável! +15 XP"],
  corrected: ["Corrected! +20 XP", "¡Corregido! +20 XP", "Corrigé ! +20 XP", "Korrigiert! +20 XP", "Corretto! +20 XP", "Corrigido! +20 XP"],
  bossWins: ["The boss wins this round. −1 ❤️", "El jefe gana esta ronda. −1 ❤️", "Le boss gagne ce round. −1 ❤️", "Der Boss gewinnt diese Runde. −1 ❤️", "Il boss vince questo round. −1 ❤️", "O chefe ganha esta ronda. −1 ❤️"],
  model: ["Model answer", "Respuesta modelo", "Réponse modèle", "Musterantwort", "Risposta modello", "Resposta modelo"],
  nextRound: ["Next round", "Siguiente ronda", "Round suivant", "Nächste Runde", "Prossimo round", "Próxima ronda"],
  round: ["Round", "Ronda", "Round", "Runde", "Round", "Ronda"],
  typeIn: ["Type in {lang}…", "Escribe en {lang}…", "Écrivez en {lang}…", "Schreibe auf {lang}…", "Scrivi in {lang}…", "Escreve em {lang}…"],
  rapidTitle: ["Rapid Fire Listening", "Fuego rápido de escucha", "Tir rapide d'écoute", "Hör-Schnellfeuer", "Fuoco rapido d'ascolto", "Fogo rápido de escuta"],
  rapidDesc: ["45 seconds, 5 questions. Listen to the bot, then pick the meaning. Correct answers add +3s and build a 3× combo.", "45 segundos, 5 preguntas. Escucha al bot y elige el significado. Cada acierto suma +3 s y combo hasta 3×.", "45 secondes, 5 questions. Écoutez le robot puis choisissez le sens. Chaque bonne réponse ajoute +3 s et un combo jusqu'à 3×.", "45 Sekunden, 5 Fragen. Höre den Bot und wähle die Bedeutung. Richtig = +3 s und Combo bis 3×.", "45 secondi, 5 domande. Ascolta il bot e scegli il significato. Ogni risposta corretta dà +3 s e combo fino a 3×.", "45 segundos, 5 perguntas. Ouve o bot e escolhe o significado. Cada acerto dá +3 s e combo até 3×."],
  playAgain: ["Play again", "Jugar otra vez", "Rejouer", "Nochmal spielen", "Gioca ancora", "Jogar outra vez"],
  listenPick: ["Listen, then pick the meaning", "Escucha y elige el significado", "Écoutez puis choisissez le sens", "Höre zu und wähle die Bedeutung", "Ascolta e scegli il significato", "Ouve e escolhe o significado"],
  earned: ["Earned so far", "Ganado", "Gagné", "Verdient", "Guadagnati", "Ganho"],
  best: ["Best", "Mejor", "Meilleur", "Bestwert", "Migliore", "Melhor"],
  // header / stats
  learning: ["Learning", "Aprendiendo", "J'apprends", "Ich lerne", "Imparo", "A aprender"],
  level: ["Level", "Nivel", "Niveau", "Level", "Livello", "Nível"],
  streak: ["Day streak", "Racha", "Série", "Serie", "Serie", "Sequência"],
  totalXp: ["Total XP", "XP total", "XP total", "Gesamt-XP", "XP totali", "XP total"],
  hearts: ["Hearts", "Vidas", "Vies", "Leben", "Vite", "Vidas"],
  bossStat: ["Boss wins", "Victorias", "Victoires", "Siege", "Vittorie", "Vitórias"],
  bestAcc: ["Best accuracy", "Mejor precisión", "Meilleure précision", "Beste Genauigkeit", "Migliore precisione", "Melhor precisão"],
  rapidBest: ["Rapid best", "Mejor rápido", "Meilleur tir", "Bester Schnellfeuer", "Miglior fuoco", "Melhor rápido"],
  pathProg: ["Path progress", "Progreso del camino", "Progression du parcours", "Lernpfad-Fortschritt", "Progresso del percorso", "Progresso do percurso"],
  toLevel: ["XP to level", "XP para el nivel", "XP avant le niveau", "XP bis Level", "XP al livello", "XP para o nível"],
  speed: ["Speech speed", "Velocidad de voz", "Vitesse de la voix", "Sprechtempo", "Velocità della voce", "Velocidade da voz"],
  levelUp: ["Level up! You're now level", "¡Subes de nivel! Ahora eres nivel", "Niveau supérieur ! Vous êtes niveau", "Level-Up! Du bist jetzt Level", "Livello superiore! Ora sei livello", "Subiste de nível! Agora és nível"],
  streakUp: ["Streak extended!", "¡Racha ampliada!", "Série prolongée !", "Serie verlängert!", "Serie estesa!", "Sequência alargada!"],
  // free chat
  chatTitle: ["Free conversation", "Conversación libre", "Conversation libre", "Freie Unterhaltung", "Conversazione libera", "Conversa livre"],
  chatIntro: ["Talk about anything with your avatar. Choose how long you want to practice.", "Habla de lo que quieras con tu avatar. Elige cuánto quieres practicar.", "Parlez de tout avec votre avatar. Choisissez la durée.", "Sprich mit deinem Avatar über alles. Wähle die Dauer.", "Parla di tutto con il tuo avatar. Scegli la durata.", "Fala de tudo com o teu avatar. Escolhe a duração."],
  minutes: ["min", "min", "min", "Min.", "min", "min"],
  noLimit: ["No limit", "Sin límite", "Sans limite", "Unbegrenzt", "Illimitato", "Sem limite"],
  startChat: ["Start chatting", "Empezar a charlar", "Commencer à discuter", "Gespräch starten", "Inizia a chattare", "Começar a conversar"],
  endChat: ["End chat", "Terminar", "Terminer", "Beenden", "Termina", "Terminar"],
  typeMsg: ["Type or tap the mic…", "Escribe o toca el micro…", "Écrivez ou touchez le micro…", "Tippe oder nutze das Mikro…", "Scrivi o tocca il microfono…", "Escreve ou toca no microfone…"],
  send: ["Send", "Enviar", "Envoyer", "Senden", "Invia", "Enviar"],
  thinking: ["thinking…", "pensando…", "réfléchit…", "denkt nach…", "sta pensando…", "a pensar…"],
  turns: ["messages sent", "mensajes enviados", "messages envoyés", "Nachrichten gesendet", "messaggi inviati", "mensagens enviadas"],
  timeUp: ["Time's up!", "¡Se acabó el tiempo!", "Temps écoulé !", "Zeit ist um!", "Tempo scaduto!", "Acabou o tempo!"],
  chatDone: ["Chat finished", "Charla terminada", "Discussion terminée", "Gespräch beendet", "Chat terminata", "Conversa terminada"],
  chatBack: ["New chat", "Nueva charla", "Nouvelle discussion", "Neues Gespräch", "Nuova chat", "Nova conversa"],
  chatErr: ["The avatar is offline right now — using simple replies.", "El avatar no está disponible ahora — uso respuestas simples.", "L'avatar est hors ligne — réponses simples.", "Der Avatar ist offline — einfache Antworten.", "L'avatar è offline — risposte semplici.", "O avatar está offline — respostas simples."],
  elapsed: ["Time practiced", "Tiempo practicado", "Temps pratiqué", "Geübte Zeit", "Tempo di pratica", "Tempo praticado"],
} satisfies Record<string, readonly string[]>;

export type K = keyof typeof S;
export type TFn = (k: K, v?: Record<string, string | number>) => string;

export function makeT(native: NativeLang): TFn {
  const i = Math.max(0, UI_ORDER.indexOf(native));
  return (k, v) => {
    const row = S[k] as readonly string[];
    let s = row[i] ?? row[0] ?? String(k);
    if (v) for (const [a, b] of Object.entries(v)) s = s.split(`{${a}}`).join(String(b));
    return s;
  };
}

const UNIT_TITLES: Record<NativeLang, string[]> = {
  en: ["Greetings & Politeness", "Cafés & Food", "Directions & Transport", "Shopping & Hotels", "Health & Emergencies"],
  es: ["Saludos y cortesía", "Cafés y comida", "Direcciones y transporte", "Compras y hoteles", "Salud y emergencias"],
  fr: ["Salutations et politesse", "Cafés et repas", "Directions et transports", "Achats et hôtels", "Santé et urgences"],
  de: ["Begrüßung & Höflichkeit", "Café & Essen", "Wegbeschreibung & Verkehr", "Einkaufen & Hotel", "Gesundheit & Notfälle"],
  it: ["Saluti e cortesia", "Caffè e cibo", "Indicazioni e trasporti", "Shopping e hotel", "Salute ed emergenze"],
  pt: ["Cumprimentos e cortesia", "Cafés e comida", "Direções e transportes", "Compras e hotéis", "Saúde e emergências"],
};
export const unitTitle = (unit: number, native: NativeLang) => UNIT_TITLES[native][unit] ?? UNIT_TITLES.en[unit] ?? "";

/** Language name written in the learner's native language (e.g. native=es, id=en -> "Inglés"). */
export function langName(id: TargetLang | NativeLang, native: NativeLang): string {
  try {
    const n = new Intl.DisplayNames([native], { type: "language" }).of(id) ?? id;
    return n.charAt(0).toLocaleUpperCase(native) + n.slice(1);
  } catch {
    return id;
  }
}
