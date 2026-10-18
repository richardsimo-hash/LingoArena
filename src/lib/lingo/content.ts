export interface Exercise {
  id: string;
  type: 'translate' | 'speak' | 'match';
  prompt: string;
  targetText: string;
  options?: string[];
  correctAnswer?: string;
}

export interface Unit {
  id: number;
  title: string;
  description: string;
  lessons: Exercise[][];
}

export const getUnitsForLanguages = (nativeLang: string, targetLang: string): Unit[] => {
  // SIEMPRE asumimos Español como idioma nativo del usuario cuando targetLang es inglés ('en')
  // para evitar que el selector superior rompa las traducciones de las opciones.
  const isSpanish = nativeLang === 'es' || nativeLang === 'Spanish' || nativeLang === 'español' || targetLang === 'en';

  return [
    {
      id: 1,
      title: isSpanish ? "Unidad 1: Saludos y Frases Básicas" : "Unit 1: Greetings & Basics",
      description: isSpanish ? "Aprende frases clave y saludos" : "Learn essential phrases and greetings",
      lessons: [
        [
          {
            id: 'u1_l1_1',
            type: 'translate',
            prompt: isSpanish ? '¿Cómo se dice: "Good morning"?' : 'How do you say: "Good morning"?',
            targetText: 'Good morning',
            options: isSpanish 
              ? ['Buenos días', 'A un café, por favor', 'La cuenta, por favor', 'Muchas gracias']
              : ['Good morning', 'A coffee, please', 'The check, please', 'Thank you very much'],
            correctAnswer: isSpanish ? 'Buenos días' : 'Good morning'
          },
          {
            id: 'u1_l1_2',
            type: 'translate',
            prompt: isSpanish ? '¿Cómo se dice: "Nice to meet you"?' : 'How do you say: "Nice to meet you"?',
            targetText: 'Nice to meet you',
            options: isSpanish 
              ? ['Mucho gusto', 'Gira a la izquierda', 'Necesito ayuda', 'Buenas noches']
              : ['Nice to meet you', 'Turn left', 'I need help', 'Good evening'],
            correctAnswer: isSpanish ? 'Mucho gusto' : 'Nice to meet you'
          }
        ]
      ]
    },
    {
      id: 2,
      title: isSpanish ? "Unidad 2: En el Restaurante" : "Unit 2: At the Restaurant",
      description: isSpanish ? "Pide comida y bebidas sin problemas" : "Order food and drinks easily",
      lessons: [
        [
          {
            id: 'u2_l1_1',
            type: 'translate',
            prompt: isSpanish ? '¿Cómo se dice: "A coffee, please"?' : 'How do you say: "A coffee, please"?',
            targetText: 'A coffee, please',
            options: isSpanish 
              ? ['Un café, por favor', 'La cuenta, por favor', 'Agua con gas', '¿Dónde está el baño?']
              : ['A coffee, please', 'The check, please', 'Sparkling water', 'Where is the bathroom'],
            correctAnswer: isSpanish ? 'Un café, por favor' : 'A coffee, please'
          }
        ]
      ]
    }
  ];
};
