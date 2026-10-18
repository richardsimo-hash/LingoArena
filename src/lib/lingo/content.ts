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

export const getUnitsForLanguages = (_nativeLang?: string, _targetLang?: string): Unit[] => {
  // Ignoramos los parámetros recibidos y forzamos siempre respuestas en Español
  return [
    {
      id: 1,
      title: "Unidad 1: Saludos y Frases Básicas",
      description: "Aprende frases clave y saludos esenciales",
      lessons: [
        [
          {
            id: 'u1_l1_1',
            type: 'translate',
            prompt: '¿Cómo se dice: "Hello"?',
            targetText: 'Hello',
            options: ['Hola', 'Buenos días', 'Gira a la izquierda', 'Quisiera agua'],
            correctAnswer: 'Hola'
          },
          {
            id: 'u1_l1_2',
            type: 'translate',
            prompt: '¿Cómo se dice: "Good morning"?',
            targetText: 'Good morning',
            options: ['Buenos días', 'Un café, por favor', 'La cuenta, por favor', 'Muchas gracias'],
            correctAnswer: 'Buenos días'
          },
          {
            id: 'u1_l1_3',
            type: 'translate',
            prompt: '¿Cómo se dice: "Nice to meet you"?',
            targetText: 'Nice to meet you',
            options: ['Mucho gusto', 'Necesito ayuda', 'Turn left', 'The bill, please'],
            correctAnswer: 'Mucho gusto'
          }
        ]
      ]
    }
  ];
};
