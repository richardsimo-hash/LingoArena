import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LingoState {
  nativeLanguage: string;
  targetLanguage: string;
  xp: number;
  hearts: number | string;
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
      nativeLanguage: 'es',
      targetLanguage: 'en',
      xp: 100,
      hearts: '∞',
      streak: 1,
      selectedPersona: 'tour-guide',

      setNativeLanguage: (lang) => set({ nativeLanguage: lang }),
      setTargetLanguage: (lang) => set({ targetLanguage: lang }),
      addXp: (amount) => set((state) => ({ xp: state.xp + amount })),
      
      useHeart: () => {
        // Vidas infinitas activas (no reduce corazones)
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
      name: 'lingo-arena-v5',
    }
  )
);
