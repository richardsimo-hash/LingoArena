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
      title: isSpanish ? "Unidad 1: Saludos y Frases Básicas" : "Unit 1: Greetings & Basics",
      description: isSpanish ? "Aprende frases clave y saludos" : "Learn essential phrases and greetings",
      lessons: [
        [
          {
            id: 'u1_l1_1',
            type: 'translate',
            prompt: isSpanish ? '¿Cómo se dice: "Thank you very much"?' : 'How do you say "Thank you very much"?',
            targetText: 'Thank you very much',
            options: isSpanish 
              ? ['Muchas gracias', 'Llama a un doctor', 'Necesito ayuda', 'Gira a la izquierda']
              : ['Thank you very much', 'Call a doctor', 'I need help', 'Turn left'],
            correctAnswer: isSpanish ? 'Muchas gracias' : 'Thank you very much'
          },
          {
            id: 'u1_l1_2',
            type: 'translate',
            prompt: isSpanish ? '¿Cómo se dice: "Nice to meet you"?' : 'How do you say "Nice to meet you"?',
            targetText: 'Nice to meet you',
            options: isSpanish 
              ? ['Mucho gusto', 'Un café, por favor', '¿Cuánto cuesta?', 'Buenos días']
              : ['Nice to meet you', 'A coffee, please', 'How much is it?', 'Good morning'],
            correctAnswer: isSpanish ? 'Mucho gusto' : 'Nice to meet you'
          }
        ]
      ]
    },
    {
      id: 2,
      title: isSpanish ? "Unidad 2: En el Restaurante" : "Unit 2: At the Restaurant",
      description: isSpanish ? "Pide comida y bebidas con facilidad" : "Order food and drinks easily",
      lessons: [
        [
          {
            id: 'u2_l1_1',
            type: 'translate',
            prompt: isSpanish ? '¿Cómo se dice: "A coffee, please"?' : 'How do you say "A coffee, please"?',
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
