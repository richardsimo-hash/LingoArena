import { UNITS, type NativeLang, type TargetLang } from "./content";

// Column order for every entry below: en, es, fr, de, it, pt
export const UI_ORDER: NativeLang[] = ["en", "es", "fr", "de", "it", "pt"];

export const S = {
  // lesson exercises ({lang} = target language name, {text} = phrase)
  exChoose: ["Choose the {lang} translation for “{text}”.", "Elige la traducción en {lang} de «{text}».", "Choisis la traduction en {lang} de « {text} ».", "Wähle die Übersetzung auf {lang} für „{text}“.", "Scegli la traduzione in {lang} di «{text}».", "Escolhe a tradução em {lang} de «{text}»."],
  exListen: ["Listen and choose the meaning of the spoken phrase.", "Escucha y elige el significado de la frase.", "Écoute et choisis le sens de la phrase.", "Hör zu und wähle die Bedeutung des Satzes.", "Ascolta e scegli il significato della frase.", "Ouve e escolhe o significado da frase."],
  exTranslate: ["Translate “{text}” into {lang}.", "Traduce «{text}» al {lang}.", "Traduis « {text} » en {lang}.", "Übersetze „{text}“ ins {lang}e.", "Traduci «{text}» in {lang}.", "Traduz «{text}» para {lang}."],
  exFill: ["Complete the {lang} phrase that means “{text}”.", "Completa la frase en {lang} que significa «{text}».", "Complète la phrase en {lang} qui veut dire « {text} ».", "Ergänze den Satz auf {lang}, der „{text}“ bedeutet.", "Completa la frase in {lang} che significa «{text}».", "Completa a frase em {lang} que significa «{text}»."],
  exSpeak: ["Say this phrase in {lang}.", "Di esta frase en {lang}.", "Dis cette phrase en {lang}.", "Sag diesen Satz auf {lang}.", "Di' questa frase in {lang}.", "Diz esta frase em {lang}."],
  kind_choose: ["Choose", "Elige", "Choisis", "Wähle", "Scegli", "Escolhe"],
  kind_listen: ["Listen", "Escucha", "Écoute", "Hör zu", "Ascolta", "Ouve"],
  kind_translate: ["Translate", "Traduce", "Traduis", "Übersetze", "Traduci", "Traduz"],
  kind_fill: ["Fill in", "Completa", "Complète", "Ergänze", "Completa", "Completa"],
  kind_speak: ["Speak", "Habla", "Parle", "Sprich", "Parla", "Fala"],
  audioAuto: ["Audio plays automatically. Replay it if you need to.", "El audio suena solo. Repítelo si lo necesitas.", "L'audio se lance tout seul. Réécoute-le si besoin.", "Das Audio startet automatisch. Spiel es bei Bedarf erneut ab.", "L'audio parte da solo. Riascoltalo se serve.", "O áudio toca sozinho. Repete se precisares."],
  phFill: ["Type the missing word…", "Escribe la palabra que falta…", "Écris le mot manquant…", "Schreib das fehlende Wort…", "Scrivi la parola mancante…", "Escreve a palavra que falta…"],
  phTranslate: ["Translate into {lang}…", "Traduce al {lang}…", "Traduis en {lang}…", "Übersetze ins {lang}e…", "Traduci in {lang}…", "Traduz para {lang}…"],
  rightAnswer: ["Correct! Nice work.", "¡Correcto! Buen trabajo.", "Correct ! Bien joué.", "Richtig! Gut gemacht.", "Giusto! Ottimo lavoro.", "Certo! Bom trabalho."],
  wrongAnswer: ["Not quite. Correct answer: {answer}", "Casi. Respuesta correcta: {answer}", "Presque. Bonne réponse : {answer}", "Fast. Richtige Antwort: {answer}", "Quasi. Risposta giusta: {answer}", "Quase. Resposta certa: {answer}"],
  tryAgainBtn: ["Try again", "Inténtalo otra vez", "Réessayer", "Nochmal versuchen", "Riprova", "Tenta outra vez"],
  responseMatch: ["Response match", "Coincidencia", "Correspondance", "Übereinstimmung", "Corrispondenza", "Correspondência"],
  speakHint: ["Say the phrase; the recognized words will be checked.", "Di la frase; se comprobarán las palabras reconocidas.", "Dis la phrase ; les mots reconnus seront vérifiés.", "Sprich den Satz; die erkannten Wörter werden geprüft.", "Di' la frase; verranno controllate le parole riconosciute.", "Diz a frase; as palavras reconhecidas serão verificadas."],
  noRecognition: ["Speech recognition isn't available. Type your answer below.", "El reconocimiento de voz no está disponible. Escribe tu respuesta abajo.", "La reconnaissance vocale n'est pas disponible. Écris ta réponse ci-dessous.", "Spracherkennung ist nicht verfügbar. Tippe deine Antwort unten ein.", "Il riconoscimento vocale non è disponibile. Scrivi la risposta qui sotto.", "O reconhecimento de voz não está disponível. Escreve a resposta abaixo."],
  transcribingRec: ["Transcribing your recording…", "Transcribiendo tu grabación…", "Transcription de ton enregistrement…", "Deine Aufnahme wird transkribiert…", "Trascrizione della registrazione…", "A transcrever a gravação…"],
  typeSaid: ["Type what you said", "Escribe lo que dijiste", "Écris ce que tu as dit", "Schreib, was du gesagt hast", "Scrivi cosa hai detto", "Escreve o que disseste"],
  cantSpeak: ["Can't speak now", "No puedo hablar ahora", "Je ne peux pas parler", "Kann gerade nicht sprechen", "Non posso parlare ora", "Não posso falar agora"],
  // tutor voice
  naturalVoice: ["Natural AI voice for the tutor", "Voz natural con IA para la tutora", "Voix naturelle (IA) pour la tutrice", "Natürliche KI-Stimme für die Tutorin", "Voce naturale IA per la tutor", "Voz natural com IA para a tutora"],
  naturalVoiceHint: ["Sounds like a real person. Uses a little internet data; off = your device's built-in voice.", "Suena como una persona real. Usa algo de datos; desactivada = voz integrada del dispositivo.", "Ressemble à une vraie personne. Utilise un peu de données ; désactivée = voix intégrée de l'appareil.", "Klingt wie ein echter Mensch. Braucht etwas Datenvolumen; aus = eingebaute Gerätestimme.", "Sembra una persona vera. Usa qualche dato; disattivata = voce integrata del dispositivo.", "Soa como uma pessoa real. Usa alguns dados; desligada = voz integrada do dispositivo."],
  // pronunciation feedback
  tapWordHint: ["Tap a word to hear it slowly.", "Toca una palabra para oírla despacio.", "Touche un mot pour l'entendre lentement.", "Tippe auf ein Wort, um es langsam zu hören.", "Tocca una parola per sentirla lentamente.", "Toca numa palavra para a ouvir devagar."],
  hearSlowly: ["Hear it slowly", "Escúchala despacio", "Écouter lentement", "Langsam anhören", "Ascolta lentamente", "Ouvir devagar"],
  weHeard: ["We heard", "Escuchamos", "Nous avons entendu", "Wir haben gehört", "Abbiamo sentito", "Ouvimos"],
  practiceWords: ["Practise: {words}", "Practica: {words}", "Entraîne-toi : {words}", "Übe: {words}", "Esercitati: {words}", "Pratica: {words}"],
  // translation reports
  reportTranslation: ["Report translation", "Reportar traducción", "Signaler la traduction", "Übersetzung melden", "Segnala traduzione", "Reportar tradução"],
  reason_wrong_translation: ["Wrong translation", "Traducción incorrecta", "Mauvaise traduction", "Falsche Übersetzung", "Traduzione sbagliata", "Tradução errada"],
  reason_unnatural: ["Sounds unnatural", "No suena natural", "Pas naturel", "Klingt unnatürlich", "Non suona naturale", "Não soa natural"],
  reason_typo: ["Typo", "Errata", "Faute de frappe", "Tippfehler", "Refuso", "Gralha"],
  reason_audio: ["Audio problem", "Problema de audio", "Problème audio", "Audioproblem", "Problema audio", "Problema de áudio"],
  commentOptional: ["Suggestion (optional)", "Sugerencia (opcional)", "Suggestion (facultatif)", "Vorschlag (optional)", "Suggerimento (facoltativo)", "Sugestão (opcional)"],
  sendReport: ["Send", "Enviar", "Envoyer", "Senden", "Invia", "Enviar"],
  thanksReport: ["Thanks! We'll review it.", "¡Gracias! Lo revisaremos.", "Merci ! Nous allons vérifier.", "Danke! Wir prüfen das.", "Grazie! Lo controlleremo.", "Obrigado! Vamos rever."],
  // motivation
  freezeUsed: ["A streak freeze saved your streak!", "¡Un protector de racha salvó tu racha!", "Un gel de série a sauvé ta série !", "Ein Serienschutz hat deine Serie gerettet!", "Un salva-serie ha salvato la tua serie!", "Um protetor salvou a tua sequência!"],
  freezesHeld: ["Streak freezes", "Protectores de racha", "Gels de série", "Serienschutz", "Salva-serie", "Protetores de sequência"],
  dailyGoal: ["Daily goal", "Meta diaria", "Objectif du jour", "Tagesziel", "Obiettivo giornaliero", "Meta diária"],
  goalReached: ["Daily goal reached!", "¡Meta diaria cumplida!", "Objectif du jour atteint !", "Tagesziel erreicht!", "Obiettivo giornaliero raggiunto!", "Meta diária cumprida!"],
  achievementsT: ["Achievements", "Logros", "Succès", "Erfolge", "Traguardi", "Conquistas"],
  newAchievement: ["New achievement", "Nuevo logro", "Nouveau succès", "Neuer Erfolg", "Nuovo traguardo", "Nova conquista"],
  parentReport: ["Progress report", "Informe de progreso", "Rapport de progression", "Fortschrittsbericht", "Report dei progressi", "Relatório de progresso"],
  parentHint: ["A weekly summary to share with a parent or teacher.", "Un resumen semanal para compartir con un padre, madre o profesor.", "Un résumé hebdomadaire à partager avec un parent ou un enseignant.", "Eine Wochenübersicht für Eltern oder Lehrkräfte.", "Un riepilogo settimanale da condividere con un genitore o insegnante.", "Um resumo semanal para partilhar com um pai, mãe ou professor."],
  shareReport: ["Share report", "Compartir informe", "Partager le rapport", "Bericht teilen", "Condividi il report", "Partilhar relatório"],
  copiedReport: ["Report copied", "Informe copiado", "Rapport copié", "Bericht kopiert", "Report copiato", "Relatório copiado"],
  last7: ["Last 7 days", "Últimos 7 días", "7 derniers jours", "Letzte 7 Tage", "Ultimi 7 giorni", "Últimos 7 dias"],
  lessonsDone: ["Lessons completed", "Lecciones completadas", "Leçons terminées", "Abgeschlossene Lektionen", "Lezioni completate", "Lições concluídas"],
  phrasesLearned: ["Phrases learned", "Frases aprendidas", "Phrases apprises", "Gelernte Sätze", "Frasi imparate", "Frases aprendidas"],
  phrasesMastered: ["Phrases mastered", "Frases dominadas", "Phrases maîtrisées", "Gemeisterte Sätze", "Frasi padroneggiate", "Frases dominadas"],
  reviewsT: ["Reviews", "Repasos", "Révisions", "Wiederholungen", "Ripassi", "Revisões"],
  currentlyAt: ["Currently at", "Ahora en", "Actuellement", "Aktuell bei", "Ora a", "Agora em"],
  weekXp: ["XP this week", "XP esta semana", "XP cette semaine", "XP diese Woche", "XP questa settimana", "XP esta semana"],
  // account + sync
  syncTitle: ["Save progress on all your devices", "Guarda tu progreso en todos tus dispositivos", "Sauvegarde ta progression sur tous tes appareils", "Fortschritt auf allen Geräten speichern", "Salva i progressi su tutti i dispositivi", "Guarda o progresso em todos os dispositivos"],
  syncHint: ["Optional. Your lessons, reviews and XP sync; chat transcripts stay on this device.", "Opcional. Se sincronizan lecciones, repasos y XP; las conversaciones se quedan en este dispositivo.", "Facultatif. Leçons, révisions et XP sont synchronisées ; les conversations restent sur cet appareil.", "Optional. Lektionen, Wiederholungen und XP werden synchronisiert; Gespräche bleiben auf diesem Gerät.", "Facoltativo. Lezioni, ripassi e XP si sincronizzano; le conversazioni restano su questo dispositivo.", "Opcional. Lições, revisões e XP são sincronizados; as conversas ficam neste dispositivo."],
  continueWith: ["Continue with {p}", "Continuar con {p}", "Continuer avec {p}", "Weiter mit {p}", "Continua con {p}", "Continuar com {p}"],
  signedInAs: ["Signed in as {who}", "Sesión iniciada como {who}", "Connecté en tant que {who}", "Angemeldet als {who}", "Accesso effettuato come {who}", "Sessão iniciada como {who}"],
  signOut: ["Sign out", "Cerrar sesión", "Se déconnecter", "Abmelden", "Esci", "Terminar sessão"],
  synced: ["Synced", "Sincronizado", "Synchronisé", "Synchronisiert", "Sincronizzato", "Sincronizado"],
  syncing: ["Syncing…", "Sincronizando…", "Synchronisation…", "Synchronisiere…", "Sincronizzazione…", "A sincronizar…"],
  syncError: ["Sync error", "Error de sincronización", "Erreur de synchronisation", "Synchronisierungsfehler", "Errore di sincronizzazione", "Erro de sincronização"],
  // learner name
  yourName: ["What's your name?", "¿Cómo te llamas?", "Comment tu t'appelles ?", "Wie heißt du?", "Come ti chiami?", "Como te chamas?"],
  namePlaceholder: ["Your first name", "Tu nombre", "Ton prénom", "Dein Vorname", "Il tuo nome", "O teu nome"],
  nameHint: ["Your tutor will use it. Saved only on this device.", "Tu tutora lo usará. Solo se guarda en este dispositivo.", "Ta tutrice l'utilisera. Enregistré uniquement sur cet appareil.", "Deine Tutorin verwendet ihn. Nur auf diesem Gerät gespeichert.", "La tua tutor lo userà. Salvato solo su questo dispositivo.", "A tua tutora vai usá-lo. Guardado apenas neste dispositivo."],
  hiName: ["Hi, {name}!", "¡Hola, {name}!", "Salut, {name} !", "Hallo, {name}!", "Ciao, {name}!", "Olá, {name}!"],
  wellDone: ["Well done, {name}!", "¡Bien hecho, {name}!", "Bravo, {name} !", "Gut gemacht, {name}!", "Ben fatto, {name}!", "Muito bem, {name}!"],
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
  retry: ["Try again — unlimited attempts", "Inténtalo otra vez: tienes intentos ilimitados", "Réessayez — tentatives illimitées", "Versuche es erneut — unbegrenzte Versuche", "Riprova — tentativi illimitati", "Tenta novamente — tentativas ilimitadas"],
  missing: ["Missing", "Faltan", "Manquant", "Fehlt", "Mancano", "Faltam"],
  extra: ["Unexpected", "Sobran", "En trop", "Zu viel", "In più", "A mais"],
  flawless: ["Flawless! +15 XP", "¡Impecable! +15 XP", "Impeccable ! +15 XP", "Fehlerfrei! +15 XP", "Impeccabile! +15 XP", "Impecável! +15 XP"],
  corrected: ["Corrected! +20 XP", "¡Corregido! +20 XP", "Corrigé ! +20 XP", "Korrigiert! +20 XP", "Corretto! +20 XP", "Corrigido! +20 XP"],
  bossWins: ["Keep practicing and try again", "Sigue practicando e inténtalo otra vez", "Continuez à pratiquer et réessayez", "Übe weiter und versuche es erneut", "Continua a esercitarti e riprova", "Continua a praticar e tenta novamente"],
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
export const unitTitle = (unit: number, native: NativeLang) => {
  const own = UNITS[unit]?.titles;
  if (own) return own[Math.max(0, UI_ORDER.indexOf(native))] || own[0];
  return UNIT_TITLES[native][unit] ?? UNIT_TITLES.en[unit] ?? UNITS[unit]?.title ?? "";
};

/** Language name as used inside a sentence (lower case except in English and German). */
export function langInSentence(id: TargetLang | NativeLang, native: NativeLang): string {
  const name = langName(id, native);
  return native === "en" || native === "de" ? name : name.toLocaleLowerCase(native);
}

/** Language name written in the learner's native language (e.g. native=es, id=en -> "Inglés"). */
export function langName(id: TargetLang | NativeLang, native: NativeLang): string {
  try {
    const n = new Intl.DisplayNames([native], { type: "language" }).of(id) ?? id;
    return n.charAt(0).toLocaleUpperCase(native) + n.slice(1);
  } catch {
    return id;
  }
}
