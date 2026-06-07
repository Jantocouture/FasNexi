import create from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OnboardingState, WardrobeItem } from '../types';

type OnboardingActions = {
  next: () => void;
  prev: () => void;
  setField: <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => void;
  addWardrobeItem: (item: WardrobeItem) => void;
  removeWardrobeItem: (id: string) => void;
  reset: () => void;
};

export const useOnboardingStore = create(
  persist<OnboardingState & OnboardingActions>(
    (set, get) => ({
      step: 1,
      archetypes: [],
      occasionPriorities: [],
      colorPrefs: [],
      favoriteDesignerIds: [],
      wardrobeItems: [],
      next: () => set((s) => ({ step: Math.min(6, s.step + 1) })),
      prev: () => set((s) => ({ step: Math.max(1, s.step - 1) })),
      setField: (key, value) => set(() => ({ [key]: value } as Partial<OnboardingState>)),
      addWardrobeItem: (item) => set((s) => ({ wardrobeItems: [...(s.wardrobeItems || []), item] })),
      removeWardrobeItem: (id) => set((s) => ({ wardrobeItems: (s.wardrobeItems || []).filter(i => i.id !== id) })),
      reset: () => set({
        step: 1,
        archetypes: [],
        bodyShape: undefined,
        measurements: undefined,
        fitPreference: undefined,
        occasionPriorities: [],
        colorPrefs: [],
        favoriteDesignerIds: [],
        budgetBand: undefined,
        sustainabilityPriority: false,
        wardrobeItems: [],
      }),
    }),
    {
      name: 'onboarding-storage',
      getStorage: () => AsyncStorage,
    }
  )
);
