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
  const isSpanish = nativeLang === 'es' || nativeLang === 'Spanish' || nativeLang === 'español';

  return [
    {
      id: 1,
      title: isSpanish ? "Unidad 1: Saludos y Básicos" : "Unit 1: Greetings & Basics",
      description: isSpanish ? "Aprende saludos y frases esenciales" : "Learn greetings and essential phrases",
      lessons: [
        [
          {
            id: 'u1_l1_1',
            type: 'translate',
            prompt: isSpanish ? 'Traduce: "Nice to meet you"' : 'Translate: "Nice to meet you"',
            targetText: 'Nice to meet you',
            options: isSpanish 
              ? ['Mucho gusto', 'Un café, por favor', '¿Cuánto cuesta?', 'Buenos días']
              : ['Nice to meet you', 'A coffee, please', 'How much is it?', 'Good morning'],
            correctAnswer: isSpanish ? 'Mucho gusto' : 'Nice to meet you'
          },
          {
            id: 'u1_l1_2',
            type: 'translate',
            prompt: isSpanish ? 'Traduce: "Thank you very much"' : 'Translate: "Thank you very much"',
            targetText: 'Thank you very much',
            options: isSpanish 
              ? ['Muchas gracias', 'Llama a un doctor', 'Necesito ayuda', 'Gira a la izquierda']
              : ['Thank you very much', 'Call a doctor', 'I need help', 'Turn left'],
            correctAnswer: isSpanish ? 'Muchas gracias' : 'Thank you very much'
          }
        ]
      ]
    }
  ];
};
