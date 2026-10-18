import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LingoState {
  nativeLanguage: string; // 'es' o 'en'
  targetLanguage: string; // 'en', 'fr', 'de', etc.
  xp: number;
  hearts: number | string; // Infinito
  streak: number;
  selectedPersona: string;
  setNativeLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  addXp: (amount: number) => void;
  useHeart: () => void;
  resetProgress: () => void;
}

export const useLingoStore = create<LingoState>()(
  persist(
    (set) => ({
      nativeLanguage: 'es', // Forzado a Español de forma predeterminada
      targetLanguage: 'en', // Aprendiendo Inglés
      xp: 100,
      hearts: '∞', // Vidas Infinitas
      streak: 1,
      selectedPersona: 'tour-guide',

      setNativeLanguage: (lang) => set({ nativeLanguage: lang }),
      setTargetLanguage: (lang) => set({ targetLanguage: lang }),
      addXp: (amount) => set((state) => ({ xp: state.xp + amount })),
      
      // Desactivamos la pérdida de vidas para progresión ilimitada
      useHeart: () => {
        // No hace nada para mantener corazones infinitos
      },

      resetProgress: () =>
        set({
          nativeLanguage: 'es',
          targetLanguage: 'en',
          xp: 0,
          hearts: '∞',
          streak: 1,
        }),
    }),
    {
      name: 'lingo-arena-storage',
    }
  )
);
