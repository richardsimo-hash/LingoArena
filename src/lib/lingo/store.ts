import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LingoState {
  nativeLanguage: string;
  targetLanguage: string;
  xp: number;
  hearts: string;
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

      setNativeLanguage: () => set({ nativeLanguage: 'es' }),
      setTargetLanguage: (lang) => set({ nativeLanguage: 'es', targetLanguage: lang }),
      addXp: (amount) => set((state) => ({ xp: state.xp + amount })),
      
      useHeart: () => {},

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
      name: 'lingo-arena-force-reset-v99',
    }
  )
);
