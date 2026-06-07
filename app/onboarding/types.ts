export type Archetype =
  | 'Bold & Vibrant'
  | 'Elegant & Timeless'
  | 'Street & Urban'
  | 'Cultural Fusion'
  | 'Sustainable & Conscious'
  | 'Avant-Garde';

export type WardrobeItem = {
  id?: string;
  imageUrl: string;
  category?: 'top' | 'bottom' | 'dress' | 'shoes' | 'accessory';
  tags?: string[];
};

export type OnboardingState = {
  step: number;
  archetypes: Archetype[];
  bodyShape?: string;
  measurements?: { heightCm?: number; bustCm?: number; waistCm?: number; hipCm?: number };
  fitPreference?: string;
  occasionPriorities: string[];
  colorPrefs: string[];
  favoriteDesignerIds: string[];
  budgetBand?: string;
  sustainabilityPriority?: boolean;
  wardrobeItems: WardrobeItem[];
};
