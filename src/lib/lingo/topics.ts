import type { NativeLang } from "./content";

/** Everyday conversation topics for Free Talk. `en` doubles as the brief sent to the AI tutor. */
export type Topic = { id: string; emoji: string; en: string; es: string };

export const TOPICS: Topic[] = [
  { id: "weekend", emoji: "🗓️", en: "Weekend plans and how you like to relax", es: "Planes de fin de semana y cómo descansas" },
  { id: "food", emoji: "🍝", en: "Favorite foods and dishes from home", es: "Comidas favoritas y platos de casa" },
  { id: "cooking", emoji: "👩‍🍳", en: "Cooking at home and recipes", es: "Cocinar en casa y recetas" },
  { id: "restaurant", emoji: "🍽️", en: "Ordering at a restaurant", es: "Pedir en un restaurante" },
  { id: "coffee", emoji: "☕", en: "Coffee, tea and morning routines", es: "Café, té y rutinas de la mañana" },
  { id: "travel", emoji: "✈️", en: "Travel memories and dream destinations", es: "Recuerdos de viaje y destinos soñados" },
  { id: "hotel", emoji: "🏨", en: "Checking in at a hotel and solving problems", es: "Registrarse en un hotel y resolver problemas" },
  { id: "directions", emoji: "🗺️", en: "Asking for and giving directions in a city", es: "Pedir y dar direcciones en una ciudad" },
  { id: "hometown", emoji: "🏘️", en: "Your hometown and where you live now", es: "Tu ciudad natal y dónde vives ahora" },
  { id: "city-country", emoji: "🌆", en: "City life versus the countryside", es: "Vida en la ciudad o en el campo" },
  { id: "work", emoji: "💼", en: "Your job and a typical workday", es: "Tu trabajo y un día típico" },
  { id: "interview", emoji: "🤝", en: "Practicing a job interview", es: "Practicar una entrevista de trabajo" },
  { id: "study", emoji: "📚", en: "Studying, school memories and learning languages", es: "Estudios, recuerdos del colegio y aprender idiomas" },
  { id: "family", emoji: "👨‍👩‍👧", en: "Family and family traditions", es: "Familia y tradiciones familiares" },
  { id: "friends", emoji: "🧑‍🤝‍🧑", en: "Friendship and meeting new people", es: "La amistad y conocer gente nueva" },
  { id: "pets", emoji: "🐶", en: "Pets and animals", es: "Mascotas y animales" },
  { id: "movies", emoji: "🎬", en: "Movies and TV series you love", es: "Películas y series que te encantan" },
  { id: "music", emoji: "🎵", en: "Music, concerts and favorite songs", es: "Música, conciertos y canciones favoritas" },
  { id: "books", emoji: "📖", en: "Books, podcasts and stories", es: "Libros, podcasts e historias" },
  { id: "sports", emoji: "⚽", en: "Sports, teams and staying active", es: "Deportes, equipos y mantenerse activo" },
  { id: "health", emoji: "🩺", en: "Health, sleep and visiting the doctor", es: "Salud, sueño y visitar al médico" },
  { id: "shopping", emoji: "🛍️", en: "Shopping, prices and bargains", es: "Compras, precios y gangas" },
  { id: "clothes", emoji: "👟", en: "Clothes, style and what to wear", es: "Ropa, estilo y qué ponerse" },
  { id: "weather", emoji: "🌦️", en: "Weather, seasons and favorite times of year", es: "El clima, las estaciones y tu época favorita" },
  { id: "holidays", emoji: "🎉", en: "Holidays, festivals and celebrations", es: "Fiestas, festivales y celebraciones" },
  { id: "birthday", emoji: "🎂", en: "Planning a birthday or party", es: "Organizar un cumpleaños o una fiesta" },
  { id: "technology", emoji: "📱", en: "Phones, apps and technology in daily life", es: "Móviles, apps y tecnología en el día a día" },
  { id: "social-media", emoji: "💬", en: "Social media: good and bad sides", es: "Redes sociales: lo bueno y lo malo" },
  { id: "childhood", emoji: "🧸", en: "Childhood memories", es: "Recuerdos de la infancia" },
  { id: "dreams", emoji: "🌟", en: "Goals, dreams and plans for the future", es: "Metas, sueños y planes de futuro" },
  { id: "transport", emoji: "🚇", en: "Getting around: buses, trains and traffic", es: "Moverse: autobuses, trenes y tráfico" },
  { id: "house", emoji: "🏠", en: "Your home, roommates and chores", es: "Tu casa, compañeros de piso y tareas" },
  { id: "money", emoji: "💸", en: "Saving money and spending habits", es: "Ahorrar dinero y hábitos de gasto" },
  { id: "nature", emoji: "🌲", en: "Nature, hiking and the outdoors", es: "Naturaleza, senderismo y aire libre" },
  { id: "environment", emoji: "♻️", en: "The environment and everyday green habits", es: "El medio ambiente y hábitos sostenibles" },
  { id: "culture", emoji: "🎭", en: "Culture differences and customs", es: "Diferencias culturales y costumbres" },
  { id: "news", emoji: "📰", en: "Something interesting you heard recently", es: "Algo interesante que oíste hace poco" },
  { id: "games", emoji: "🎮", en: "Games, hobbies and free time", es: "Juegos, aficiones y tiempo libre" },
  { id: "small-talk", emoji: "🙂", en: "Small talk with a neighbor or coworker", es: "Charla casual con un vecino o compañero" },
  { id: "would-you-rather", emoji: "🤔", en: "Fun 'would you rather' questions", es: "Preguntas divertidas de '¿qué prefieres?'" },
];

export function topicLabel(topic: Topic, native: NativeLang) {
  return native === "es" ? topic.es : topic.en;
}

/** Random topic, avoiding the ones used recently. */
export function randomTopic(exclude: string[] = []): Topic {
  const pool = TOPICS.filter((topic) => !exclude.includes(topic.id));
  const list = pool.length ? pool : TOPICS;
  return list[Math.floor(Math.random() * list.length)]!;
}

/** Short encouragements Chloe uses when the learner is silent, so the conversation keeps going. */
export const NUDGES: Record<string, string[]> = {
  en: ["Take your time. Here's an easier one:", "No rush! Let me ask it another way:", "That's okay. Try this:"],
  es: ["Tómate tu tiempo. Te pregunto algo más fácil:", "¡Sin prisa! Lo digo de otra forma:", "Tranquilo. Prueba con esto:"],
  fr: ["Prends ton temps. Une question plus simple :", "Pas de stress ! Je reformule :", "Ce n'est pas grave. Essaie ceci :"],
  de: ["Lass dir Zeit. Eine leichtere Frage:", "Kein Stress! Ich frage anders:", "Kein Problem. Versuch das:"],
  it: ["Prenditi il tuo tempo. Una domanda più facile:", "Nessuna fretta! Lo dico in un altro modo:", "Va bene. Prova questo:"],
  pt: ["Leva o teu tempo. Uma pergunta mais fácil:", "Sem pressa! Pergunto de outra forma:", "Tudo bem. Tenta isto:"],
  ja: ["ゆっくりでいいですよ。簡単な質問です：", "あわてなくて大丈夫。言い方を変えますね：", "大丈夫です。これはどうですか："],
};
